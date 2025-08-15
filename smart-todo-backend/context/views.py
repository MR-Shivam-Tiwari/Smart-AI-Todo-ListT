from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import requests
import google.generativeai as genai
from django.conf import settings
from .models import ContextEntry
from .serializers import (
    ContextEntrySerializer, 
    ContextEntryCreateSerializer
)

class ContextEntryViewSet(viewsets.ModelViewSet):
    queryset = ContextEntry.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContextEntryCreateSerializer
        return ContextEntrySerializer
    
    def list(self, request):
        """List all context entries with AI processing status"""
        queryset = self.get_queryset()
        
        # Filter by source type
        source_type = request.query_params.get('source_type', None)
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        
        # Filter by processing status
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(processing_status=status_filter)
        
        # Search in content and insights
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(processed_insights__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create new context entry and process with AI"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = serializer.save()
        
        # Return the processed entry with insights
        response_serializer = ContextEntrySerializer(entry)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess entry with AI"""
        entry = get_object_or_404(ContextEntry, pk=pk)
        
        # Process with AI
        insights = entry.process_with_ai()
        
        serializer = ContextEntrySerializer(entry)
        return Response({
            'message': 'Entry reprocessed successfully with Gemini AI',
            'entry': serializer.data,
            'new_insights': insights,
            'processing_status': entry.processing_status
        })
    
    @action(detail=False, methods=['get'])
    def ai_status(self, request):
        """Get Gemini AI status"""
        try:
            # Configure and test Gemini AI connection
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Simple test query
            response = model.generate_content("Hello, respond with 'Connected' if you receive this.")
            
            if response and response.text:
                return Response({
                    'ai_connected': True,
                    'server': 'Google Gemini',
                    'model': 'gemini-1.5-flash',
                    'server_url': 'https://generativelanguage.googleapis.com',
                    'test_successful': True,
                    'message': ' Gemini AI is connected and responding'
                })
        except Exception as e:
            error_msg = str(e).upper()
            if "API_KEY" in error_msg or "INVALID" in error_msg:
                message = " Invalid Gemini API key"
                instructions = [
                    '1. Verify your Gemini API key is correct',
                    '2. Check Google AI Studio for API key status',
                    '3. Ensure API key has proper permissions'
                ]
            elif "QUOTA" in error_msg or "LIMIT" in error_msg:
                message = " Gemini API quota exceeded"
                instructions = [
                    '1. Check your API usage in Google AI Studio',
                    '2. Wait for quota reset or upgrade plan',
                    '3. Monitor your API usage'
                ]
            else:
                message = f" Gemini connection failed: {str(e)[:100]}"
                instructions = [
                    '1. Check your internet connection',
                    '2. Verify API key configuration',
                    '3. Try again in a few moments'
                ]
            
            return Response({
                'ai_connected': False,
                'server': 'Google Gemini',
                'model': 'gemini-1.5-flash',
                'message': message,
                'instructions': instructions
            })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get enhanced context statistics"""
        total_entries = ContextEntry.objects.count()
        
        # Count by source type
        whatsapp_count = ContextEntry.objects.filter(source_type='whatsapp').count()
        email_count = ContextEntry.objects.filter(source_type='email').count()
        notes_count = ContextEntry.objects.filter(source_type='notes').count()
        
        # Processing stats
        processed_count = ContextEntry.objects.filter(processing_status='processed').count()
        failed_count = ContextEntry.objects.filter(processing_status='failed').count()
        processing_count = ContextEntry.objects.filter(processing_status='processing').count()
        
        # Total insights
        total_insights = sum(
            len(entry.processed_insights) if entry.processed_insights else 0
            for entry in ContextEntry.objects.filter(processing_status='processed')
        )
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_entries = ContextEntry.objects.filter(
            created_at__gte=week_ago
        ).order_by('-created_at')[:5]
        
        recent_activity = []
        for entry in recent_entries:
            recent_activity.append({
                'id': entry.id,
                'content': entry.content[:50] + '...' if len(entry.content) > 50 else entry.content,
                'source_type': entry.source_type,
                'processing_status': entry.processing_status,
                'created_at': entry.created_at,
                'insights_count': entry.insights_count
            })
        
        # AI processing efficiency
        ai_success_rate = (processed_count / total_entries * 100) if total_entries > 0 else 0
        
        stats_data = {
            'total_entries': total_entries,
            'whatsapp_count': whatsapp_count,
            'email_count': email_count,
            'notes_count': notes_count,
            'processed_count': processed_count,
            'failed_count': failed_count,
            'processing_count': processing_count,
            'total_insights': total_insights,
            'ai_success_rate': round(ai_success_rate, 1),
            'recent_activity': recent_activity
        }
        
        return Response(stats_data)
    
    @action(detail=False, methods=['delete'])
    def clear_old(self, request):
        """Clear entries older than 30 days"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        deleted_count = ContextEntry.objects.filter(
            created_at__lt=thirty_days_ago
        ).delete()[0]
        
        return Response({
            'message': f'Deleted {deleted_count} old entries',
            'deleted_count': deleted_count
        })

@api_view(['GET'])
def ai_health_check(request):
    """Detailed Gemini AI health check"""
    try:
        # Configure and test Gemini AI
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Test AI processing with a simple query
        test_response = model.generate_content("Test connection - respond with 'OK' if working")
        
        if test_response and test_response.text:
            return Response({
                'status': 'connected',
                'server': 'Google Gemini',
                'model': 'gemini-1.5-flash',
                'server_url': 'https://generativelanguage.googleapis.com',
                'test_successful': True,
                'test_response': test_response.text[:50],
                'message': ' Gemini AI is running and responding correctly'
            })
        else:
            return Response({
                'status': 'partial',
                'server': 'Google Gemini', 
                'message': ' Gemini connected but not responding properly'
            })
            
    except Exception as e:
        return Response({
            'status': 'disconnected',
            'server': 'Google Gemini',
            'model': 'gemini-1.5-flash',
            'error': str(e)[:100],
            'message': ' Gemini AI connection failed',
            'instructions': [
                '1. Verify your Gemini API key in settings.py',
                '2. Check Google AI Studio for API key status', 
                '3. Ensure you have available quota',
                '4. Check your internet connection'
            ]
        })

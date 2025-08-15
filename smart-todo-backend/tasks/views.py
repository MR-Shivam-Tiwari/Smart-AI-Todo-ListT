from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
import google.generativeai as genai
import logging
from .models import Task, Category, AIInsight
from .serializers import TaskSerializer, TaskCreateSerializer, CategorySerializer

logger = logging.getLogger(__name__)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer
    
    def create(self, request, *args, **kwargs):
        """Create task with AI enhancement"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # Return enhanced task data
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def enhance_with_ai(self, request, pk=None):
        """Manually trigger AI enhancement for existing task"""
        task = get_object_or_404(Task, pk=pk)
        
        try:
            suggestions = task.enhance_with_ai()
            return Response({
                'message': 'Task enhanced successfully with Gemini AI',
                'task': TaskSerializer(task).data,
                'ai_suggestions': suggestions,
                'ai_enhanced': task.ai_enhanced
            })
        except Exception as e:
            return Response({
                'error': f'AI enhancement failed: {str(e)}',
                'task': TaskSerializer(task).data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    #  ADD THIS MISSING ENDPOINT:
    @action(detail=False, methods=['get'], url_path='contextual_analysis')
    def contextual_analysis(self, request):
        """Get contextual analysis data for AI enhancement"""
        try:
            # Get task statistics
            total_tasks = Task.objects.count()
            completed_tasks = Task.objects.filter(status='completed').count()
            
            # Get recent tasks for pattern analysis
            recent_tasks = Task.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).order_by('-created_at')[:10]
            
            recent_task_titles = [task.title for task in recent_tasks]
            
            # Calculate current workload
            pending_tasks = Task.objects.filter(status='pending').count()
            in_progress_tasks = Task.objects.filter(status='in_progress').count()
            current_workload = 'High' if (pending_tasks + in_progress_tasks) > 10 else 'Medium' if (pending_tasks + in_progress_tasks) > 5 else 'Low'
            
            # Get user patterns
            category_stats = Category.objects.annotate(
                task_count=Count('task')
            ).order_by('-task_count')
            
            preferred_categories = [cat.name for cat in category_stats[:3]] if category_stats.exists() else ['Work', 'Personal', 'Learning']
            
            # Calculate average completion time
            completed_tasks_with_time = Task.objects.filter(
                status='completed',
                estimated_time__isnull=False
            )
            
            avg_completion_time = completed_tasks_with_time.aggregate(
                avg_time=Avg('estimated_time')
            )['avg_time'] or 2.5
            
            # Peak productivity hours (mock data - in real app, analyze task creation patterns)
            peak_hours = ['09:00-11:00', '14:00-16:00']
            
            return Response({
                'total_entries': total_tasks,
                'recent_tasks': recent_task_titles,
                'current_workload': current_workload,
                'user_patterns': {
                    'preferred_categories': preferred_categories,
                    'average_completion_time': round(avg_completion_time, 1),
                    'peak_productivity_hours': peak_hours
                },
                'statistics': {
                    'total_tasks': total_tasks,
                    'completed_tasks': completed_tasks,
                    'pending_tasks': pending_tasks,
                    'in_progress_tasks': in_progress_tasks,
                    'completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
                }
            })
            
        except Exception as e:
            logger.error(f"Contextual analysis error: {str(e)}")
            # Return fallback data
            return Response({
                'total_entries': 0,
                'recent_tasks': [],
                'current_workload': 'Low',
                'user_patterns': {
                    'preferred_categories': ['Work', 'Personal', 'Learning'],
                    'average_completion_time': 2.5,
                    'peak_productivity_hours': ['09:00-11:00', '14:00-16:00']
                },
                'statistics': {
                    'total_tasks': 0,
                    'completed_tasks': 0,
                    'pending_tasks': 0,
                    'in_progress_tasks': 0,
                    'completion_rate': 0
                }
            })
    
    @action(detail=False, methods=['post'], url_path='get_ai_suggestions')
    def get_ai_suggestions(self, request):
        """Get AI suggestions for task without creating it"""
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        category = request.data.get('category', '')
        priority = request.data.get('priority', 'medium')
        
        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Configure Gemini AI
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""You are an expert productivity assistant. Analyze this potential task and provide actionable insights.

TASK PREVIEW:
Title: "{title}"
Description: "{description or 'No description'}"
Category: "{category or 'No category'}"
Priority: "{priority}"

Provide exactly 6-7 quick suggestions in this format:
 [Specific advice about task breakdown or approach]
 [Time management and scheduling recommendation]
 [Priority level assessment and justification]
 [Best category suggestion or confirmation]
 [One powerful productivity tip for this specific task]
 [Success strategy or key focus area]
 [One game-changing insight for maximum efficiency]

Keep each suggestion to 1-2 sentences and make them highly actionable."""

            response = model.generate_content(prompt)
            
            # Parse response
            suggestions = []
            if response and response.text:
                lines = response.text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line and len(line) > 10 and any(emoji in line[:5] for emoji in ['', '', '', '', '', '', '']):
                        suggestions.append(line)
            
            # Fallback if no suggestions
            if not suggestions:
                suggestions = [
                    f" Break '{title}' into 3-4 smaller actionable steps for better progress tracking",
                    f" Estimated completion time: 2-4 hours based on similar {priority} priority tasks",
                    f" {priority.title()} priority level is appropriate for this type of task",
                    f" {category or 'Work'} category would be ideal for organizing this task",
                    " Use the Pomodoro technique (25-minute focused sessions) for sustained concentration",
                    " Start with the most challenging part when your energy levels are highest",
                    " Set a specific outcome measure to track completion and maintain motivation"
                ]
            
            # Enhanced response with additional AI analysis
            return Response({
                'suggestions': suggestions[:7],
                'ai_powered': True,
                'generated_at': timezone.now().isoformat(),
                'priority_analysis': {
                    'recommended_priority': priority,
                    'priority_score': self._calculate_priority_score(priority, title, description),
                    'reasoning': f'{priority.title()} priority recommended based on task characteristics and urgency indicators'
                },
                'category_analysis': {
                    'recommended_category': category or 'Work',
                    'confidence': 0.8,
                    'reasoning': f'Task content suggests {category or "Work"} category placement'
                },
                'deadline_suggestion': {
                    'recommended_deadline': self._suggest_deadline(priority).isoformat() if self._suggest_deadline(priority) else None,
                    'reasoning': f'Recommended timeline based on {priority} priority level and estimated complexity'
                },
                'enhancement_suggestions': {
                    'enhanced_description': description or f'Complete the task: {title} with focus on quality and timely delivery',
                    'tags': self._extract_tags(title, description, category)
                }
            })
            
        except Exception as e:
            # Return fallback suggestions
            fallback_suggestions = [
                f" Break '{title}' into smaller, manageable steps for better execution",
                f" Consider allocating 2-3 hours for completion based on {priority} priority",
                f" {priority.title()} priority level seems appropriate for this task",
                " Choose a category that groups similar tasks for better organization",
                " Schedule this task during your peak energy hours for best results",
                " Define success criteria clearly before starting",
                " Focus on progress over perfection to maintain momentum"
            ]
            
            return Response({
                'suggestions': fallback_suggestions,
                'ai_powered': False,
                'fallback': True,
                'error': str(e),
                'priority_analysis': {
                    'recommended_priority': priority,
                    'priority_score': 50,
                    'reasoning': 'Fallback analysis - unable to connect to AI service'
                }
            })
    
    def _calculate_priority_score(self, priority, title, description):
        """Calculate priority score based on various factors"""
        base_scores = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'urgent': 95
        }
        
        score = base_scores.get(priority, 50)
        
        # Adjust based on keywords
        urgent_keywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
        important_keywords = ['important', 'priority', 'deadline', 'client', 'meeting']
        
        text = f"{title} {description}".lower()
        
        if any(keyword in text for keyword in urgent_keywords):
            score += 15
        elif any(keyword in text for keyword in important_keywords):
            score += 10
        
        return min(score, 100)
    
    def _suggest_deadline(self, priority):
        """Suggest deadline based on priority"""
        now = timezone.now()
        
        if priority == 'urgent':
            return now + timedelta(days=1)
        elif priority == 'high':
            return now + timedelta(days=3)
        elif priority == 'medium':
            return now + timedelta(days=7)
        else:  # low
            return now + timedelta(days=14)
    
    def _extract_tags(self, title, description, category):
        """Extract relevant tags from task content"""
        text = f"{title} {description}".lower()
        
        # Common tag patterns
        tag_patterns = {
            'meeting': ['meeting', 'call', 'conference'],
            'research': ['research', 'analyze', 'study'],
            'development': ['develop', 'build', 'create', 'design'],
            'planning': ['plan', 'organize', 'schedule'],
            'review': ['review', 'check', 'audit'],
            'client': ['client', 'customer', 'stakeholder']
        }
        
        tags = []
        for tag, keywords in tag_patterns.items():
            if any(keyword in text for keyword in keywords):
                tags.append(tag.title())
        
        # Add category as tag if present
        if category:
            tags.append(category)
        
        return tags[:5]  # Limit to 5 tags
    
    @action(detail=False, methods=['get'])
    def ai_status(self, request):
        """Check Gemini AI integration status"""
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Quick test
            response = model.generate_content("Respond with 'Gemini AI Connected' if working")
            
            if response and response.text:
                return Response({
                    'ai_connected': True,
                    'provider': 'Google Gemini',
                    'model': 'gemini-1.5-flash',
                    'status': 'Connected and operational',
                    'test_response': response.text[:50],
                    'message': ' Gemini AI ready for task enhancement'
                })
        except Exception as e:
            return Response({
                'ai_connected': False,
                'provider': 'Google Gemini',
                'model': 'gemini-1.5-flash',
                'status': 'Connection failed',
                'error': str(e)[:100],
                'message': '❌ Gemini AI unavailable - using fallback suggestions'
            })
    
    def retrieve(self, request, pk=None):
        """Get single task by ID for editing"""
        task = get_object_or_404(Task, pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """Update entire task (PUT)"""
        task = get_object_or_404(Task, pk=pk)
        
        # Handle category_name if provided
        if 'category_name' in request.data:
            category_name = request.data.pop('category_name')
            if category_name:
                category, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'icon': '📋', 'color': '#6B7280'}
                )
                request.data['category'] = category.id
        
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """Update specific fields (PATCH)"""
        task = get_object_or_404(Task, pk=pk)
        
        # Handle category_name if provided
        if 'category_name' in request.data:
            category_name = request.data.pop('category_name')
            if category_name:
                category, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'icon': '📋', 'color': '#6B7280'}
                )
                request.data['category'] = category.id
        
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete task"""
        task = get_object_or_404(Task, pk=pk)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category CRUD operations"""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    
    def list(self, request):
        """List all categories"""
        categories = self.queryset
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get single category"""
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data)
    
    def create(self, request):
        """Create new category"""
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

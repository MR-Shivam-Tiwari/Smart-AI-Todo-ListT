from django.db import models
from django.utils import timezone
from django.core.validators import MinLengthValidator
from django.conf import settings
import requests
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class ContextEntry(models.Model):
    SOURCE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('notes', 'Notes'),
    ]
    
    STATUS_CHOICES = [
        ('unprocessed', 'Unprocessed'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ]
    
    content = models.TextField(
        validators=[MinLengthValidator(5)],
        help_text="Context content from various sources"
    )
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='notes'
    )
    processing_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='unprocessed'
    )
    processed_insights = models.JSONField(
        default=list,
        blank=True,
        help_text="AI-generated insights and task suggestions"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Context Entry"
        verbose_name_plural = "Context Entries"
    
    def __str__(self):
        return f"{self.get_source_type_display()} - {self.content[:50]}..."
    
    @property
    def insights_count(self):
        """Calculate insights count for serializer"""
        return len(self.processed_insights) if self.processed_insights else 0
    
    def process_with_ai(self):
        """ Real AI Processing with Google Gemini"""
        self.processing_status = 'processing'
        self.save()
        
        try:
            # Configure Gemini AI
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Enhanced intelligent AI prompt for task analysis
            system_prompt = f"""You are an expert AI task management assistant analyzing {self.source_type} content.

TASK: Analyze the provided content and generate exactly 6-8 actionable insights in the specified format.

REQUIRED FORMAT (use these exact emojis and structure):
 Priority: [urgent/high/medium/low] - [specific reason why this priority level]
 Category: [Work/Personal/Health/Learning/Family/Finance/Travel/Shopping] - [reasoning for this category]
 Time estimate: [X hours/minutes] - [complexity analysis and reasoning]
 Main task: [specific, actionable item that needs to be completed]
 Key insight: [important observation or pattern identified in the content]
⚡ Recommendation: [specific next step or action to take]
 Suggested deadline: [realistic timeframe based on priority and complexity]
 Smart tip: [productivity enhancement or efficiency suggestion]

CONTENT TO ANALYZE:
Source Type: {self.get_source_type_display()}
Content: "{self.content}"

INSTRUCTIONS:
- Provide exactly 6-8 insights following the format above
- Be specific and actionable in your recommendations  
- Consider the source type (WhatsApp vs Email vs Notes) in your analysis
- Focus on practical task management advice
- Each insight should start with the specified emoji
- Keep insights concise but meaningful (1-2 sentences each)"""
            
            # Generate AI response
            response = model.generate_content(system_prompt)
            ai_analysis = response.text
            
            # Parse AI response into insights
            insights = self.parse_ai_response(ai_analysis)
            
            # Add success indicator with model info
            insights.append(" AI Analysis complete - Powered by Google Gemini 1.5 Flash")
            insights.append(f" Processing time: {timezone.now().strftime('%H:%M:%S')}")
            
            self.processed_insights = insights
            self.processing_status = 'processed'
            self.processed_at = timezone.now()
            
            logger.info(f"Successfully processed entry {self.id} with Gemini - {len(insights)} insights generated")
            
        except Exception as e:
            logger.error(f"Gemini AI processing error for entry {self.id}: {str(e)}")
            
            # Enhanced error handling with specific error types
            error_str = str(e).upper()
            if "API_KEY" in error_str or "INVALID" in error_str:
                self.processed_insights = [
                    " Gemini API Key Error - Invalid or expired API key",
                    " Please check your Gemini API key configuration",
                    " Verify API key is active in Google AI Studio",
                    " Using fallback analysis..."
                ]
            elif "QUOTA" in error_str or "LIMIT" in error_str:
                self.processed_insights = [
                    " Gemini API Quota Exceeded - Rate limit reached",
                    " Please wait a few minutes before retrying",
                    " Using basic analysis instead..."
                ]
            elif "BLOCKED" in error_str or "SAFETY" in error_str:
                self.processed_insights = [
                    "⚠️ Content blocked by Gemini safety filters",
                    " Try rephrasing your content or use different wording",
                    " Using fallback analysis..."
                ]
            else:
                self.processed_insights = [
                    f" Gemini AI Error: {str(e)[:100]}...",
                    " Check your internet connection and API key",
                    " Try reprocessing in a few moments",
                    " Using fallback analysis..."
                ]
            
            # Add basic fallback analysis
            self.processed_insights.extend(self.generate_fallback_insights())
            self.processing_status = 'failed'
        
        self.save()
        return self.processed_insights
    
    def parse_ai_response(self, ai_text):
        """Parse Gemini AI response into structured insights"""
        insights = []
        
        if not ai_text:
            return [" No AI response received from Gemini"]
        
        # Split by lines and clean up
        lines = ai_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 10:  # Skip empty or very short lines
                # Check if line starts with expected emojis
                if any(char in line[:3] for char in '💤💼👥💊📚👨‍👩‍👧‍👦💰✈️🛒⚡'):
                    insights.append(line)
                elif any(line.lower().startswith(prefix) for prefix in ['priority:', 'category:', 'time estimate:', 'main task:', 'key insight:', 'recommendation:', 'suggested deadline:', 'smart tip:']):
                    # Add appropriate emoji if missing
                    if line.lower().startswith('priority:'):
                        line = f" {line}"
                    elif line.lower().startswith('category:'):
                        line = f" {line}"
                    elif line.lower().startswith('time estimate:'):
                        line = f" {line}"
                    elif line.lower().startswith('main task:'):
                        line = f" {line}"
                    elif line.lower().startswith('key insight:'):
                        line = f" {line}"
                    elif line.lower().startswith('recommendation:'):
                        line = f"⚡ {line}"
                    elif line.lower().startswith('suggested deadline:'):
                        line = f" {line}"
                    elif line.lower().startswith('smart tip:'):
                        line = f" {line}"
                    
                    insights.append(line)
        
        # Ensure we have meaningful insights
        if not insights:
            insights = [" AI analysis completed - insights processed with Google Gemini"]
        
        return insights[:10]  # Limit to 10 insights max
    
    def generate_fallback_insights(self):
        """Generate basic insights when AI fails"""
        insights = []
        content_lower = self.content.lower()
        
        # Priority detection with reasoning
        if any(word in content_lower for word in ['urgent', 'asap', 'immediately', 'critical', 'emergency']):
            insights.append(" Priority: High - Urgent keywords detected in content")
        elif any(word in content_lower for word in ['deadline', 'due', 'tomorrow', 'today', 'soon']):
            insights.append(" Priority: Medium - Time-sensitive indicators found")
        elif any(word in content_lower for word in ['important', 'priority', 'focus']):
            insights.append(" Priority: Medium - Importance indicators present")
        else:
            insights.append(" Priority: Low - Standard task with no urgency indicators")
        
        # Enhanced category detection
        if any(word in content_lower for word in ['work', 'office', 'project', 'client', 'meeting', 'presentation', 'report']):
            insights.append(" Category: Work - Professional context detected")
        elif any(word in content_lower for word in ['buy', 'purchase', 'shopping', 'order', 'store']):
            insights.append(" Category: Shopping - Purchase-related content")
        elif any(word in content_lower for word in ['health', 'doctor', 'exercise', 'medical', 'fitness']):
            insights.append(" Category: Health - Health and wellness context")
        elif any(word in content_lower for word in ['learn', 'study', 'course', 'book', 'training']):
            insights.append(" Category: Learning - Educational content detected")
        elif any(word in content_lower for word in ['family', 'mom', 'dad', 'brother', 'sister', 'parents']):
            insights.append(" Category: Family - Family-related context")
        elif any(word in content_lower for word in ['money', 'bank', 'payment', 'finance', 'investment']):
            insights.append(" Category: Finance - Financial context detected")
        elif any(word in content_lower for word in ['travel', 'trip', 'vacation', 'flight', 'hotel']):
            insights.append(" Category: Travel - Travel-related content")
        else:
            insights.append(" Category: Personal - General personal task")
        
        # Smart time estimation
        word_count = len(self.content.split())
        if word_count > 150:
            insights.append(" Time estimate: 3-5 hours - Complex task based on content length")
        elif word_count > 100:
            insights.append(" Time estimate: 2-3 hours - Medium complexity task")
        elif word_count > 50:
            insights.append(" Time estimate: 1-2 hours - Standard task")
        else:
            insights.append(" Time estimate: 30-60 minutes - Quick task")
        
        # Main task extraction
        key_words = ' '.join(self.content.split()[:8])
        insights.append(f" Main task: {key_words}...")
        
        # Smart recommendations based on source
        if self.source_type == 'whatsapp':
            insights.append("⚡ Recommendation: Quick action needed - WhatsApp messages are usually urgent")
        elif self.source_type == 'email':
            insights.append("⚡ Recommendation: Professional follow-up required - email context")
        else:
            insights.append("⚡ Recommendation: Schedule dedicated time for completion")
        
        # Deadline suggestion
        if any(word in content_lower for word in ['today', 'urgent']):
            insights.append(" Suggested deadline: Today by end of day")
        elif any(word in content_lower for word in ['tomorrow', 'soon']):
            insights.append(" Suggested deadline: Tomorrow")
        else:
            insights.append(" Suggested deadline: Within next 3-5 days")
        
        return insights

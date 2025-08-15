from django.db import models
from django.utils import timezone
from django.conf import settings
import google.generativeai as genai
import json
import logging

logger = logging.getLogger(__name__)

class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=10, default='📋')
    color = models.CharField(max_length=7, default='#6B7280')
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    priority_score = models.IntegerField(default=50)  # AI-calculated score
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    deadline = models.DateTimeField(null=True, blank=True)
    estimated_time = models.FloatField(null=True, blank=True, help_text="Estimated hours")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ai_enhanced = models.BooleanField(default=False)
    ai_suggestions = models.JSONField(default=list, blank=True, help_text="Gemini AI suggestions")
    ai_processed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-priority_score', '-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-enhance with AI when created
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            try:
                self.enhance_with_ai()
            except Exception as e:
                logger.error(f"AI enhancement failed for task {self.id}: {str(e)}")
    
    def enhance_with_ai(self):
        """ Enhance task with Gemini AI insights"""
        try:
            # Configure Gemini AI
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Create comprehensive prompt for task analysis
            prompt = f"""You are an expert productivity and task management assistant. Analyze this task and provide intelligent insights.

TASK DETAILS:
Title: "{self.title}"
Description: "{self.description or 'No description provided'}"
Category: "{self.category.name if self.category else 'No category'}"
Priority: "{self.get_priority_display()}"
Deadline: "{self.deadline.strftime('%Y-%m-%d %H:%M') if self.deadline else 'No deadline set'}"
Estimated Time: "{self.estimated_time} hours" if self.estimated_time else "No time estimate"

ANALYSIS REQUIRED:
Provide exactly 6-8 actionable insights in this specific format:

 Task Breakdown: [How to break this into smaller actionable steps]
 Time Management: [Realistic time estimate and scheduling suggestions]
 Priority Analysis: [Why this priority level is appropriate or suggest changes]
 Category Optimization: [Best category placement and why]
 Deadline Strategy: [Smart deadline recommendations based on complexity]
 Productivity Tips: [Specific techniques to complete this task efficiently]
 Success Factors: [Key elements that will determine success]
 AI Recommendation: [One powerful insight to maximize task completion]

INSTRUCTIONS:
- Be specific and actionable
- Consider the task complexity and context
- Provide realistic time estimates
- Focus on practical productivity advice
- Each insight should be 1-2 sentences maximum
- Use the exact emoji format shown above"""

            # Generate AI response
            response = model.generate_content(prompt)
            ai_analysis = response.text
            
            # Parse AI response into structured suggestions
            suggestions = self.parse_gemini_response(ai_analysis)
            
            # Calculate AI-enhanced priority score
            priority_score = self.calculate_ai_priority_score()
            
            # Update task with AI insights
            self.ai_suggestions = suggestions
            self.ai_enhanced = True
            self.ai_processed_at = timezone.now()
            self.priority_score = priority_score
            
            self.save(update_fields=['ai_suggestions', 'ai_enhanced', 'ai_processed_at', 'priority_score'])
            
            logger.info(f" Task {self.id} enhanced with Gemini AI - {len(suggestions)} insights generated")
            return suggestions
            
        except Exception as e:
            logger.error(f" Gemini AI enhancement failed for task {self.id}: {str(e)}")
            
            # Fallback AI suggestions
            fallback = self.generate_fallback_ai_insights()
            self.ai_suggestions = fallback
            self.ai_enhanced = False
            self.save(update_fields=['ai_suggestions', 'ai_enhanced'])
            
            return fallback
    
    def parse_gemini_response(self, ai_text):
        """Parse Gemini AI response into structured insights"""
        suggestions = []
        
        if not ai_text:
            return self.generate_fallback_ai_insights()
        
        lines = ai_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 10:
                # Check if line contains expected insight patterns
                if any(emoji in line[:5] for emoji in ['', '', '', '', '', '', '', '']):
                    suggestions.append(line)
                elif any(line.startswith(prefix) for prefix in [
                    'Task Breakdown:', 'Time Management:', 'Priority Analysis:', 
                    'Category Optimization:', 'Deadline Strategy:', 'Productivity Tips:', 
                    'Success Factors:', 'AI Recommendation:'
                ]):
                    # Add appropriate emoji if missing
                    if line.startswith('Task Breakdown:'):
                        line = f" {line}"
                    elif line.startswith('Time Management:'):
                        line = f" {line}"
                    elif line.startswith('Priority Analysis:'):
                        line = f" {line}"
                    elif line.startswith('Category Optimization:'):
                        line = f" {line}"
                    elif line.startswith('Deadline Strategy:'):
                        line = f" {line}"
                    elif line.startswith('Productivity Tips:'):
                        line = f" {line}"
                    elif line.startswith('Success Factors:'):
                        line = f" {line}"
                    elif line.startswith('AI Recommendation:'):
                        line = f" {line}"
                    
                    suggestions.append(line)
        
        # Ensure we have meaningful suggestions
        if not suggestions:
            return self.generate_fallback_ai_insights()
        
        return suggestions[:8]  # Limit to 8 insights
    
    def calculate_ai_priority_score(self):
        """Calculate AI-enhanced priority score"""
        base_score = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'urgent': 100
        }.get(self.priority, 50)
        
        # Adjust based on deadline
        if self.deadline:
            days_left = (self.deadline - timezone.now()).days
            if days_left <= 1:
                base_score += 20
            elif days_left <= 3:
                base_score += 10
            elif days_left <= 7:
                base_score += 5
        
        # Adjust based on estimated time
        if self.estimated_time:
            if self.estimated_time >= 8:  # Long tasks
                base_score += 10
            elif self.estimated_time >= 4:  # Medium tasks
                base_score += 5
        
        # Adjust based on category importance
        important_categories = ['Work', 'Health', 'Finance']
        if self.category and self.category.name in important_categories:
            base_score += 10
        
        return min(base_score, 100)  # Cap at 100
    
    def generate_fallback_ai_insights(self):
        """Generate basic AI insights when Gemini fails"""
        suggestions = []
        
        # Task breakdown
        word_count = len(self.title.split())
        if word_count > 5:
            suggestions.append(" Task Breakdown: Break this complex task into 3-4 smaller subtasks for better progress tracking")
        else:
            suggestions.append(" Task Breakdown: This task is well-defined - focus on clear execution steps")
        
        # Time management
        if self.estimated_time:
            if self.estimated_time > 4:
                suggestions.append(f" Time Management: Large task ({self.estimated_time}h) - consider splitting across multiple work sessions")
            else:
                suggestions.append(f" Time Management: Manageable duration ({self.estimated_time}h) - perfect for focused completion")
        else:
            suggestions.append(" Time Management: Estimate 2-4 hours based on task complexity")
        
        # Priority analysis
        priority_advice = {
            'urgent': " Priority Analysis: Urgent priority confirmed - tackle immediately for best results",
            'high': " Priority Analysis: High priority justified - schedule in your peak energy hours",
            'medium': " Priority Analysis: Medium priority appropriate - balance with other commitments",
            'low': " Priority Analysis: Low priority - perfect for filling gaps between important tasks"
        }
        suggestions.append(priority_advice.get(self.priority, priority_advice['medium']))
        
        # Category optimization
        if self.category:
            suggestions.append(f" Category Optimization: {self.category.name} category fits well - group with similar tasks")
        else:
            suggestions.append(" Category Optimization: Consider adding a category for better organization")
        
        # Deadline strategy
        if self.deadline:
            days_left = (self.deadline - timezone.now()).days
            if days_left <= 1:
                suggestions.append(" Deadline Strategy: Urgent deadline - prioritize immediately and focus on core deliverables")
            elif days_left <= 7:
                suggestions.append(" Deadline Strategy: Good timeline - plan checkpoint at 50% completion")
            else:
                suggestions.append(" Deadline Strategy: Comfortable timeline - break into weekly milestones")
        else:
            suggestions.append(" Deadline Strategy: Set a realistic deadline to maintain momentum and accountability")
        
        # Productivity tips
        suggestions.append(" Productivity Tips: Use the Pomodoro technique (25-min focus blocks) for sustained concentration")
        
        # Success factors
        suggestions.append(" Success Factors: Clear outcome definition and progress tracking will ensure completion")
        
        # AI recommendation
        suggestions.append(" AI Recommendation: Start with the most challenging aspect when your energy is highest")
        
        return suggestions

class AIInsight(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=50)  # 'suggestion', 'deadline', 'priority'
    content = models.TextField()
    confidence_score = models.FloatField(default=0.8)
    created_at = models.DateTimeField(auto_now_add=True)
    applied = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.insight_type} for {self.task.title}"

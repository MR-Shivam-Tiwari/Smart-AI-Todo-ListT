from rest_framework import serializers
from .models import Task, Category, AIInsight

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'usage_count', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)
    ai_suggestions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'category_name', 'category_details',
            'priority', 'priority_score', 'status', 'deadline', 'estimated_time',
            'created_at', 'updated_at', 'ai_enhanced', 'ai_suggestions', 
            'ai_processed_at', 'ai_suggestions_count'
        ]
    
    def get_ai_suggestions_count(self, obj):
        return len(obj.ai_suggestions) if obj.ai_suggestions else 0

class TaskCreateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'category_name', 'priority', 
            'deadline', 'estimated_time'
        ]
    
    def create(self, validated_data):
        category_name = validated_data.pop('category_name', None)
        
        # Handle category creation/retrieval
        if category_name:
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    'icon': self.get_category_icon(category_name),
                    'color': self.get_category_color(category_name)
                }
            )
            # Increment usage count
            category.usage_count += 1
            category.save()
            validated_data['category'] = category
        
        # Create task  
        return Task.objects.create(**validated_data)
    
    def get_category_icon(self, name):
        """Get appropriate icon for category"""
        icons = {
            'Work': '💼', 'Personal': '👤', 'Health': '💊', 'Learning': '📚',
            'Family': '👨‍👩‍👧‍👦', 'Finance': '💰', 'Travel': '✈️', 'Shopping': '🛒'
        }
        return icons.get(name, '📋')
    
    def get_category_color(self, name):
        """Get appropriate color for category"""
        colors = {
            'Work': '#3B82F6', 'Personal': '#10B981', 'Health': '#EF4444', 
            'Learning': '#F59E0B', 'Family': '#8B5CF6', 'Finance': '#059669',
            'Travel': '#06B6D4', 'Shopping': '#EC4899'
        }
        return colors.get(name, '#6B7280')

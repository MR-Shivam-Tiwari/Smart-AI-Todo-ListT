from rest_framework import serializers
from .models import ContextEntry

class ContextEntrySerializer(serializers.ModelSerializer):
    insights_count = serializers.ReadOnlyField()
    
    class Meta:
        model = ContextEntry
        fields = [
            'id', 'content', 'source_type', 'processing_status',
            'processed_insights', 'metadata', 'insights_count',
            'created_at', 'updated_at', 'processed_at'
        ]

class ContextEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContextEntry
        fields = ['content', 'source_type', 'metadata']
    
    def create(self, validated_data):
        entry = ContextEntry.objects.create(**validated_data)
        # Auto-process with AI in background
        try:
            entry.process_with_ai()
        except Exception as e:
            # Log error but don't fail creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"AI processing failed for entry {entry.id}: {str(e)}")
        
        return entry

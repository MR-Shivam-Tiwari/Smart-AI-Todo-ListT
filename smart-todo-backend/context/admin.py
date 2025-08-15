from django.contrib import admin
from .models import ContextEntry

@admin.register(ContextEntry)
class ContextEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'content_preview', 'source_type', 'processing_status', 'insights_count', 'created_at']
    list_filter = ['source_type', 'processing_status', 'created_at']
    search_fields = ['content', 'processed_insights']
    readonly_fields = ['processed_at', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Content', {
            'fields': ('content', 'source_type', 'metadata')
        }),
        ('Processing', {
            'fields': ('processing_status', 'processed_insights', 'processed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'
    
    def insights_count(self, obj):
        return len(obj.processed_insights) if obj.processed_insights else 0
    insights_count.short_description = 'Insights'
    
    actions = ['reprocess_entries']
    
    def reprocess_entries(self, request, queryset):
        for entry in queryset:
            entry.process_with_ai()
        self.message_user(request, f'Reprocessed {queryset.count()} entries')
    reprocess_entries.short_description = 'Reprocess selected entries with AI'

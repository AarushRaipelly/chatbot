# from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Session, Message

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'is_guest_session', 'created_at', 'updated_at', 'message_count']
    list_filter = ['is_guest_session', 'created_at', 'updated_at']
    search_fields = ['title', 'user__username', 'guest_session_id']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'content_preview', 'timestamp']
    list_filter = ['role', 'timestamp', 'session__is_guest_session']
    search_fields = ['content', 'session__title']
    readonly_fields = ['timestamp']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
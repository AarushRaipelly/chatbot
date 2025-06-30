# from django.db import models

# class Session(models.Model):
#     title = models.CharField(max_length=100, default="New Chat")
#     created_at = models.DateTimeField(auto_now_add=True)

# class Message(models.Model):
#     session = models.ForeignKey(Session, related_name='messages', on_delete=models.CASCADE)
#     role = models.CharField(max_length=20)  # 'user' or 'assistant'
#     content = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

from django.db import models
from django.contrib.auth.models import User
import uuid

class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # null for guest sessions
    title = models.CharField(max_length=100, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_guest_session = models.BooleanField(default=False)
    guest_session_id = models.CharField(max_length=100, null=True, blank=True)  # for guest session tracking

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.user:
            return f"{self.user.username} - {self.title}"
        return f"Guest - {self.title}"

class Message(models.Model):
    session = models.ForeignKey(Session, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20)  # 'user' or 'assistant'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
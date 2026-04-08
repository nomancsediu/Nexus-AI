from django.db import models
from content.models import ContentSource


class LearningSession(models.Model):
    content_source = models.ForeignKey(ContentSource, on_delete=models.CASCADE, related_name='sessions')
    weak_points = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.id}"


class Message(models.Model):
    ROLES = [('user', 'User'), ('assistant', 'Assistant')]
    session = models.ForeignKey(LearningSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

from django.db import models

class ContentSource(models.Model):
    SOURCE_TYPES = [('youtube', 'YouTube'), ('text', 'Text'), ('url', 'URL')]

    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    source_url = models.URLField(blank=True, null=True)
    raw_text = models.TextField(blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    key_points = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.source_type} - {self.id}"

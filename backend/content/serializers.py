from rest_framework import serializers
from .models import ContentSource

class ContentSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentSource
        fields = '__all__'
        read_only_fields = ['transcript', 'summary', 'key_points', 'created_at']

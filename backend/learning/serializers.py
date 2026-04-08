from rest_framework import serializers
from .models import LearningSession, Message
from content.serializers import ContentSourceSerializer


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at']


class LearningSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    content_source = ContentSourceSerializer(read_only=True)

    class Meta:
        model = LearningSession
        fields = ['id', 'content_source', 'weak_points', 'messages', 'created_at', 'updated_at']

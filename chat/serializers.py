from rest_framework import serializers
from .models import Conversation, Message


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = [
            'id',
            'created_at',
            'last_activity_at'
        ]
        read_only_fields = fields

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'content',
            'created_at',
            'role'
        ]
        read_only_fields = fields
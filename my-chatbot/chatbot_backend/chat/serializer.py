# from rest_framework import serializers
# from .models import Session, Message

# class MessageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Message
#         fields = '__all__'

# class SessionSerializer(serializers.ModelSerializer):
#     messages = MessageSerializer(many=True, read_only=True)

#     class Meta:
#         model = Session
#         fields = '__all__'

from rest_framework import serializers
from .models import Session, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'timestamp']

class SessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_guest_session', 'messages', 'message_count']

    def get_message_count(self, obj):
        return obj.messages.count()

class SessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing sessions without messages"""
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'title', 'created_at', 'updated_at', 'message_count', 'last_message']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'timestamp': last_msg.timestamp,
                'role': last_msg.role
            }
        return None
from django.db import models


class Conversation(models.Model):
    user = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    class MessageRole(models.TextChoices):
        USER = "user", "USER"
        ASSISTANT = "assistant", "ASSISTANT"
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    role = models.CharField(
        max_length=10,
        choices=MessageRole.choices,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
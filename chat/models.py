from django.db import models


class Conversation(models.Model):
    user = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="conversations"
    )
    summary = models.TextField(blank=True, default="")
    last_activity_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user", "USER"
        MODEL = "model", "MODEL"
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    class Meta:
        indexes = [
            models.Index(fields=["conversation", "created_at"])
        ]
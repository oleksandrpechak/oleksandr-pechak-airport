from celery import shared_task
from .models import Message, Conversation
from .services.gemini import generate_summary
import logging

logger = logging.getLogger(__name__)

@shared_task
def summarize_conversation(conversation_id):
    conversation = Conversation.objects.get(id = conversation_id)
    messages = (
        Message.objects.filter(
        conversation = conversation
        ).order_by("-created_at")[:5]
    )
    messages = reversed(list(messages))

    lines = []
    for m in messages:
        lines.append(f"{m.role}: {m.content}")
    formatted = "\n".join(lines)
    summary_part = f"Previous summary: {conversation.summary}\n" if conversation.summary else ""

    prompt = (
        f"{summary_part} "
        f"New messages:\n{formatted}\n"
        "Summarize into a short list: what was the user's goal, "
        "which flights or locations were mentioned."
    )
    summary = generate_summary(prompt)
    conversation.summary = summary
    conversation.save(update_fields=["summary"])
from ..models import Message, Conversation
from users.models import CustomUser
from django.utils.timezone import now
from datetime import timedelta
from ..tasks import summarize_conversation
from .gemini import generate_response
from ..tools import ALL_TOOLS



def prepare_chat_context(user: CustomUser, content:str):
    cutoff = now() - timedelta(minutes=15)
    conversation = (
        Conversation.objects.filter(
          user = user,
          last_activity_at__gte = cutoff
        ).order_by("-last_activity_at").first()
    )
    if not conversation:
        conversation = Conversation.objects.create(user = user)

    message = Message.objects.create(
        conversation = conversation,
        role = Message.Role.USER,
        content = content,
    )
    conversation.last_activity_at = now()
    conversation.save(update_fields=["last_activity_at"])

    messages = Message.objects.filter(conversation = conversation)
    if messages.count() > 0 and messages.count() % 5 == 0:
        summarize_conversation.delay(conversation.id)

    recent_messages = Message.objects.filter(
        conversation=conversation
        ).order_by("-created_at")[:5]
    recent_messages = reversed(list(recent_messages))
    contents = []
    if conversation.summary:
        contents.append({
            "role": "user",
            "parts": [{"text": f"Previous context: {conversation.summary}"}]
            })
    for m in recent_messages:
        contents.append({
            "role": m.role,
            "parts": [{"text": m.content}]
            })
    return (conversation, contents)
    
def save_chat_response(conversation, response_text):
    message = Message.objects.create(
        conversation = conversation,
        role = Message.Role.MODEL,
        content = response_text,
        )
    return response_text






"""
    1. Find active conversation (last_activity_at within 15 min) or create new one
    2. Save user message to DB
    3. Update conversation.last_activity_at
    4. If message count % 5 == 0: generate and store summary on Conversation
    5. Build context: summary (if exists) + messages since last summary
    6. Send context + user message to Gemini
    7. If Gemini returns function_call: execute tool, send result back to Gemini
    8. Save Gemini final response as Message with role="model"
    9. Return response text
"""
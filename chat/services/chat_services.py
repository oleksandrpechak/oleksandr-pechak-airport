from chat.models import Message, Conversation
from users.models import CustomUser
from django.utils.timezone import now
from datetime import timedelta
from chat.tasks import summarize_conversation



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






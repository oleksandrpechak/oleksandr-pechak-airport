from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from users.models import CustomUser
from rest_framework_simplejwt.tokens import AccessToken
from .services.chat_services import prepare_chat_context, save_chat_response
from .services.gemini import generate_response
from .tools import ALL_TOOLS
import json
import logging
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
import asyncio


logger = logging.getLogger(__name__)



@database_sync_to_async
def get_user_from_token(token: str):
    try:
        validated = AccessToken(token)
        user_id = validated["user_id"]
        return CustomUser.objects.get(id=user_id)
    except (TokenError, InvalidToken):
        logger.warning("Invalid or expired token")
        return None
    except CustomUser.DoesNotExist:
        logger.warning(f"User with id {user_id} not found")
        return None

prepare_chat_message_async = database_sync_to_async(prepare_chat_context)
save_chat_message_async = database_sync_to_async(save_chat_response)

async def iterate_sync_generator(gen):
    loop = asyncio.get_event_loop()
    DONE = object()
    def next_item():
        try:
            return next(gen)
        except StopIteration:
            return DONE
    
    while True:
        item = await loop.run_in_executor(None, next_item)
        if item is DONE:
            break
        logger.info(f"Chunk: {repr(item)}")
        yield item


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]
        user = await get_user_from_token(token)
        if not user:
            await self.close()
            return
        self.user = user
        await self.accept()
        self.last_message_time = 0
        self.message_count = 0

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content")
        if not content:
            await self.send(json.dumps({"error": "Content is required"}))
            return
        
        conversation, contents = await prepare_chat_message_async(self.user, content)
        chunks = []
        gen = generate_response(contents, ALL_TOOLS)
        async for chunk in iterate_sync_generator(gen):
            chunks.append(chunk)
            await self.send(json.dumps({"chunk": chunk}))

        full_text = "".join(chunks)
        await save_chat_message_async(conversation, full_text)
        await self.send(json.dumps({"done": True}))
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from chat.models import Conversation, Message
from chat.views import prepare_chat_context, save_chat_response



User = get_user_model()

class ConversationViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="testa@ta.com",password="testpass123")
        self.other_user = User.objects.create_user(email="user2@ta.com",password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.user_conversation = Conversation.objects.create(user=self.user)
        self.other_conversation = Conversation.objects.create(user=self.other_user)

        self.list_url = "/api/chat/conversations/"
        self.detail_url = f"/api/chat/conversations/{self.user_conversation.id}/"

    def test_authenticated_user_can_list_conversations(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_unauthenticated_user_cannot_list_conversations(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_user_cannot_see_another_users_conversations(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        conversation_ids = [
            item["id"] for item in response.data["results"]
        ]
        self.assertIn(self.user_conversation.id, conversation_ids)
        self.assertNotIn(self.other_conversation.id, conversation_ids)
    def test_user_can_delete_own_conversation(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Conversation.objects.filter(id=self.user_conversation.id).exists()
        )
    def test_user_cannot_delete_another_users_conversation(self):
        url = f"/api/chat/conversations/{self.other_conversation.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            Conversation.objects.filter(
                id=self.other_conversation.id
            ).exists()
        )
class ChatAPIViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

        self.url = "/api/chat/message/"
    @patch("chat.tasks.summarize_conversation.delay")
    def test_prepare_chat_context_creates_conversation_and_user_message(self, mock_summary_task):
        conversation, contents = prepare_chat_context(
            user=self.user,
            content="Show me flights"
        )

        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 1)
        message = Message.objects.get()
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.role, Message.Role.USER)
        self.assertEqual(message.content, "Show me flights")

        self.assertEqual(len(contents), 1)
        self.assertEqual(contents[0]["role"], Message.Role.USER)
        self.assertEqual(contents[0]["parts"][0]["text"], "Show me flights")

        mock_summary_task.assert_not_called()
    @patch("chat.tasks.summarize_conversation.delay")
    def test_prepare_chat_context_reuses_active_conversation(self, mock_summary_task):
        existing_conversation = Conversation.objects.create(user=self.user)

        conversation, contents = prepare_chat_context(
            user=self.user,
            content="Continue chat"
        )

        self.assertEqual(conversation.id, existing_conversation.id)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 1)

        message = Message.objects.get()
        self.assertEqual(message.conversation, existing_conversation)
        self.assertEqual(message.content, "Continue chat")
    @patch("chat.tasks.summarize_conversation.delay")
    def test_prepare_chat_context_calls_summary_task_every_five_messages(self, mock_summary_task):
        conversation = Conversation.objects.create(user=self.user)
        for i in range(4):
            Message.objects.create(
                conversation=conversation,
                role=Message.Role.USER,
                content=f"Message {i}"
            )
        conversation, contents = prepare_chat_context(
            user=self.user,
            content="Fifth message"
        )
        self.assertEqual(
            Message.objects.filter(conversation=conversation).count(),
            5
        )
        mock_summary_task.assert_called_once_with(conversation.id)
    def test_prepare_chat_context_adds_summary_to_contents(self):
        conversation = Conversation.objects.create(
            user=self.user,
            summary="User asked about flights before."
        )

        conversation, contents = prepare_chat_context(
            user=self.user,
            content="Show me tickets"
        )

        self.assertEqual(contents[0]["role"], "user")
        self.assertIn("Previous context:", contents[0]["parts"][0]["text"])
        self.assertIn(
            "User asked about flights before.",
            contents[0]["parts"][0]["text"]
        )
    def test_save_chat_response_creates_model_message(self):
        conversation = Conversation.objects.create(user=self.user)

        result = save_chat_response(
            conversation=conversation,
            response_text="Here are available flights."
        )
        self.assertEqual(result, "Here are available flights.")
        self.assertEqual(Message.objects.count(), 1)
        message = Message.objects.get()
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.role, Message.Role.MODEL)
        self.assertEqual(message.content, "Here are available flights.")
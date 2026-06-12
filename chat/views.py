from .models import Conversation, Message
from .serializers import MessageSerializer, ConversationSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.viewsets import mixins
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsOwner, IsAdmin
from rest_framework.decorators import action
import logging


logger = logging.getLogger(__name__)

class ConversationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
    ):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
class ChatAPIView(APIView):
    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(id=pk, user=request.user)
        except Conversation.DoesNotExist:
            logger.warning(f'Conversation with id {pk} does not exist')
            return Response (
                {'detail': f'Conversation with id {pk} does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )
        content = request.data.get('content')
        if not content:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        message = Message.objects.create(
            conversation = conversation,
            role = Message.MessageRole.USER,
            content = content
        )

        return Response(MessageSerializer(message).data, status=status.HTTP_200_OK)

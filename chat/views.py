from .models import Conversation
from .serializers import ConversationSerializer
from .services.chat_services import prepare_chat_context, save_chat_response
from .services.gemini import generate_response
from .tools import ALL_TOOLS
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.viewsets import mixins
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
import logging


logger = logging.getLogger(__name__)

class ConversationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
    ):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'chat'

    def post(self, request):
        content = request.data.get('content')
        if not content:
            return Response (
                {'detail': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            conversation, contents = prepare_chat_context(request.user, content)
            response_text = "".join(generate_response(contents, ALL_TOOLS))
            save_chat_response(conversation, response_text)
            return Response({'response': response_text}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        

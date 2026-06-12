from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, ChatAPIView
router = DefaultRouter()


router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('message/', ChatAPIView.as_view(), name='chat'),
]
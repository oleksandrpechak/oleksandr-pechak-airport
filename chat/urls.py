from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, ChatAPIView
router = DefaultRouter()

router.register(r'chat', ConversationViewSet,basename='conversation')


urlpatterns = [
    path('', include(router.urls)),
    path('conversations/<int:pk>/messages/', ChatAPIView.as_view(), name='chat')
]
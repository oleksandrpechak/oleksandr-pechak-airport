from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet


router = DefaultRouter()
router.register(r'customusers', CustomUserViewSet,basename='customuser')
urlpatterns = [
    path('me/', CustomUserViewSet.as_view({'get': 'me', 'patch': 'me'}), name='user-me'),
    path('', include(router.urls)),
]

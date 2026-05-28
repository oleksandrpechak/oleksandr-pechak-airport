from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import CustomUser
from .serializers import CustomUserSerializer
from .filters import CustomUserFilter
from rest_framework import viewsets



class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter,]
    filterset_class = CustomUserFilter
    search_fields = [
        "email", "first_name", "last_name"
    ]
    ordering_fields = [
        "role", "first_name", "last_name"
    ]




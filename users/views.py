from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'first_name': ['exact', 'istartswith'],
        'last_name': ['exact', 'istartswith'],
        'role': ['exact', 'istartswith'],
        'email': ['exact', 'istartswith'],
    }



from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter


class CustomUserList(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    filter_backends = [SearchFilter, OrderingFilter]

    search_fields = ['first_name', 'last_name', 'role']

    ordering_fields = ['firts_name', 'last_name', 'role']
    ordering = ['last_name']

class CustomUserDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
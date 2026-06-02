from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Country, City
from .serializers import CountrySerializer, CitySerializer
from .filters import CountryFilter
from rest_framework.permissions import IsAuthenticated


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = CountryFilter
    search_fields = [
        "country",
        "code",
    ]

    ordering_fields = [
        "country",
        "code",
    ]

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]
    search_fields = [
        "city",
        "country",
    ]

    ordering_fields = [
        "city",
        "country",
    ]




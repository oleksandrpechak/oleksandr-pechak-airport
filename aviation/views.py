from .models import Airplane, Airline, Airport
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer
from .filters import AirplaneFilter, AirlineFilter, AirportFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets


class AirplaneViewSet(viewsets.ModelViewSet):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirplaneFilter
    search_fields = [
        "brand", "model", "rows", "seats_per_row"
    ]

    ordering_fields = [
        "brand", "model", "rows", "seats_per_row"
    ]


class AirlineViewSet(viewsets.ModelViewSet):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirlineFilter
    search_fields = [
        "name", "is_active", "founded_year"
    ]

    ordering_fields = [
        "name", "is_active", "founded_year"
    ]

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirportFilter
    search_fields = [
        "name", "model", "rows", "seats_per_row"
    ]

    ordering_fields = [
        "brand", "model", "rows", "seats_per_row"
    ]
 
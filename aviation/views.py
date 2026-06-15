from .models import Airplane, Airline, Airport, AirplaneSeat, FleetItem
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer, AirplaneSeatSerializer, FleetItemSerializer
from .filters import AirplaneFilter, AirlineFilter, AirportFilter, AirplaneSeatFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdmin
from .services.airplane_seat_service import create_airplane_with_seats

class AirplaneViewSet(viewsets.ModelViewSet):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

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
    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        create_airplane_with_seats(validated_data)

class AirplaneSeatViewSet(viewsets.ModelViewSet):
    queryset = AirplaneSeat.objects.all()
    serializer_class = AirplaneSeatSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]
    filterset_class = AirplaneSeatFilter


class AirlineViewSet(viewsets.ModelViewSet):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirlineFilter

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
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
 
class FleetItemViewSet(viewsets.ModelViewSet):
    queryset = FleetItem.objects.all()
    serializer_class = FleetItemSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    filter_backends = [
        SearchFilter,
        OrderingFilter
    ]
    search_fields = [
        "tail_number"
    ]
    ordering_fields = ["airplane", "airline"]
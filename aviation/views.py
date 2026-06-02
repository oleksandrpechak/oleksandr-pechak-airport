from .models import Airplane, Airline, Airport, AirplaneSeat, FleetItem
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer, AirplaneSeatSerializer, FleetItemSerializer
from .filters import AirplaneFilter, AirlineFilter, AirportFilter, AirplaneSeatFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class AirplaneViewSet(viewsets.ModelViewSet):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer
    permission_classes = [IsAuthenticated]
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

class AirplaneSeatViewSet(viewsets.ModelViewSet):
    queryset = AirplaneSeat.objects.all()
    serializer_class = AirplaneSeatSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]
    filterset_class = AirplaneSeatFilter
    search_fields = [

    ]

class AirlineViewSet(viewsets.ModelViewSet):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirlineFilter

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
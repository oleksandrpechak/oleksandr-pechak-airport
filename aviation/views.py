from .models import Airplane, Airline, Airport, AirplaneSeat, FleetItem
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer, AirplaneSeatSerializer, FleetItemSerializer
from .filters import AirplaneFilter, AirlineFilter, AirportFilter, AirplaneSeatFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.permissions import IsAdmin

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
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirlineFilter
    search_fields = ["name"]
    ordering_fields = ["name", "founded_year"]

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.select_related("city__country").prefetch_related("airline")
    serializer_class = AirportSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_class = AirportFilter
    search_fields = [
        "name", "iata_code", "city__city", "city__country__country"
    ]

    ordering_fields = [
        "name", "iata_code"
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
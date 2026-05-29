from .models import Flight, Ticket, AirplaneSeat, Booking
from .serializers import FlightSerializer, TicketSerializer, AirplaneSeatSerializer, BookingSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from django.db import transaction
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import FlightFilter, TicketFilter, BookingFilter, AirplaneSeatFilter
from django_filters.rest_framework import DjangoFilterBackend

class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter]

    filterset_class = FlightFilter
    search_fields = [
        "flight_number",
        "departure_airport",
        "arrival_airport",
    ]

    ordering_fields = [
        "ticket_price",
        "code",
    ]

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer


class AirplaneSeatViewSet(viewsets.ModelViewSet):
    queryset = AirplaneSeat.objects.all()
    serializer_class = AirplaneSeatSerializer

class Booking(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

from .models import Flight, Ticket, Booking
from .serializers import FlightSerializer, TicketSerializer, BookingSerializer
from .services.flight_service import create_flight_with_tickets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from django.db import transaction
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import FlightFilter, TicketFilter, BookingFilter
from django_filters.rest_framework import DjangoFilterBackend

class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        flight = create_flight_with_tickets(serializer.validated_data)

        return Response(FlightSerializer(flight).data, status=status.HTTP_201_CREATED)

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
        ]

    filterset_class = FlightFilter
    search_fields = [
        "flight_number",
        "departure_airport",
        "arrival_airport",
    ]

    ordering_fields = [
        "ticket_price",
        "flight_number",
    ]

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]
    filterset_class = TicketFilter
    search_fields = [

    ]

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

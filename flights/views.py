from .models import Flight, Ticket, Booking
from .serializers import FlightSerializer, TicketSerializer, BookingSerializer, BookingCreateSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from django.db import transaction
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import FlightFilter, TicketFilter, BookingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .services.flight_service import cancel_booking
from rest_framework.decorators import action

class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(
            data=request.data,
            context={'request': request}
            )
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = cancel_booking(
            user=request.user,
            booking_id=pk
        )
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


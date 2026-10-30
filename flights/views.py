from .models import Flight, Ticket, Booking
from .serializers import (
    FlightSerializer, FlightReadSerializer, TicketSerializer, BookingSerializer,
    BookingCreateSerializer, SeatMapSerializer
)
from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets, mixins
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import FlightFilter, TicketFilter, BookingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsOwner, IsAdmin
from .services.flight_service import cancel_booking
from rest_framework.decorators import action


class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer

    def get_queryset(self):
        return (
            Flight.objects.select_related(
                "departure_airport__city__country",
                "arrival_airport__city__country",
                "airplane__airplane",
                "airline_name",
            )
            .annotate(available_seats=Count(
                "tickets",
                filter=Q(tickets__ticket_status=Ticket.TicketStatus.AVAILABLE)
            ))
            .order_by("departure_time", "id")
        )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FlightReadSerializer
        return FlightSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'seatmap']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
        ]
    filterset_class = FlightFilter
    search_fields = [
        "flight_number",
        "departure_airport__name",
        "departure_airport__iata_code",
        "departure_airport__city__city",
        "arrival_airport__name",
        "arrival_airport__iata_code",
        "arrival_airport__city__city",
        "airline_name__name",
    ]

    ordering_fields = [
        "ticket_price",
        "flight_number",
        "departure_time",
        "arrival_time",
        "available_seats",
    ]

    @extend_schema(responses=SeatMapSerializer(many=True))
    @action(detail=True, methods=['get'])
    def seatmap(self, request, pk=None):
        flight = self.get_object()
        tickets = (
            flight.tickets.select_related("flight_seat")
            .order_by("flight_seat__row", "flight_seat__seat")
        )
        return Response(SeatMapSerializer(tickets, many=True).data, status=status.HTTP_200_OK)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Ticket.objects.all()
        return Ticket.objects.filter(passenger_name=self.request.user)
    def get_permissions(self):
        if self.action == 'retrieve':
            return [IsAuthenticated(), IsOwner()]
        if self.action == 'list':
            return[IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]
    filterset_class = TicketFilter

class BookingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    filterset_class = BookingFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["created_at", "total_price"]

    def get_queryset(self):
        queryset = (
            Booking.objects.select_related("payment")
            .prefetch_related(
                "tickets__flight_seat",
                "tickets__flight_number__departure_airport",
                "tickets__flight_number__arrival_airport",
            )
            .order_by("-created_at")
        )
        if self.request.user.role == 'ADMIN':
            return queryset
        return queryset.filter(user=self.request.user)

    def get_permissions(self):
        if self.action == 'cancel':
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]

    @extend_schema(request=BookingCreateSerializer, responses={201: BookingSerializer})
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

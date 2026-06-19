from .models import Flight, Ticket, Booking
from .serializers import FlightSerializer, TicketSerializer, BookingSerializer, BookingCreateSerializer, SeatMapSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import FlightFilter, TicketFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsOwner, IsAdmin
from .services.flight_service import cancel_booking, create_flight_with_tickets
from rest_framework.decorators import action


class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    
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
        "departure_airport",
        "arrival_airport",
    ]

    ordering_fields = [
        "ticket_price",
        "flight_number",
    ]
    def perform_create(self, serializer):
        create_flight_with_tickets(serializer.validated_data)
    @action(detail=True, methods=['get'])
    def seatmap(self, request, pk=None):
        tickets = Ticket.objects.filter(flight_number_id = pk)
        return Response(SeatMapSerializer(tickets, many=True).data, status=status.HTTP_200_OK)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_queryset(self):
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

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def get_permissions(self):
        if self.action == 'cancel':
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]

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

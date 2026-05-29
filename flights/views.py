from .models import Flight, Ticket, AirplaneSeat, Booking
from .serializers import FlightSerializer, TicketSerializer, TicketCreateSerializer, AirplaneSeatSerializer, BookingSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from django.db import transaction

class BookTicketView(APIView):
    def post(self, request):
        serializer = TicketCreateSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                flight = Flight.objects.select_for_update().get(
                    id=serializer.validated_data['flight_number']
                )
                if flight.available_tickets <= 0:
                    return Response({"error": "Flight is full"}, status=status.HTTP_400_BAD_REQUEST)
                serializer.save()
                flight.available_tickets -= 1
                flight.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer



class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer


class AirplaneSeatViewSet(viewsets.ModelViewSet):
    queryset = AirplaneSeat.objects.all()
    serializer_class = AirplaneSeatSerializer

class Booking(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

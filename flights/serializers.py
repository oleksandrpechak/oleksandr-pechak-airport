from rest_framework import serializers
from .models import Flight, Ticket


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = [
            "id", "departure_airport", "arrival_airport",
            "departure_time", "arrival_time", "airline_name",
            "flight_status"
            ] 
        
class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "id", "flight_id", "client_id",
            "ticket_price", "ticket_status"
        ]


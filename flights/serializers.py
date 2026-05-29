from rest_framework import serializers
from .models import Flight, Ticket, AirplaneSeat, Booking


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = [
            "id", "flight_number", "departure_airport", "arrival_airport",
            "departure_time", "arrival_time", "ticket_price", "airplane", "airline_name",
            "flight_status", "created_at"
            ]
    
    def validate(self,attrs):
        """
        The main coordinator.
        """
        errors = {}
        # rule 1
        self._validate_timestamps(attrs, errors)
        # rule 2
        self._validate_airports(attrs, errors)


        if errors:
            raise serializers.ValidationError(errors)
        return attrs
    
    def _validate_timestamps(self, attrs, errors):
        dep_time = attrs.get("departure_time")
        arr_time = attrs.get("arrival_time")
        if dep_time and arr_time and arr_time <= dep_time:
            errors['arrival_time'] = "Arrival time must be after departure time."

    def _validate_airports(self, attrs, errors):
        dep = attrs.get("departure_airport")
        arr =attrs.get("arrival_airport")
        if dep and arr and dep == arr:
            errors['arrival_airport'] = "Arrival airport and departure airport cannot be the same."


class TicketSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ticket
        fields = [
            "id", "flight_seat", "passenger_name",
            "seat", "ticket_status"
        ]
        read_only_fields = ["id", "ticket_status"]
    


class AirplaneSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirplaneSeat
        fields = ["id", "flight_number", "row", "seat", "class_type", "status", "price" ]

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user_id", "created_at", "status", "total_price"]
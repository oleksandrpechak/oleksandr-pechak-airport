from rest_framework import serializers
from .models import Flight, Ticket, Booking
from .services.flight_service import create_flight_with_tickets, create_booking

class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = '__all__'
        read_only_fields = ['id', 'flight_status', 'created_at']

    def create(self, validated_data):
        return create_flight_with_tickets(validated_data)
        
    def validate(self,attrs):
        """
        The main coordinator.
        """
        errors = {}
        # rule 1
        self._validate_timestamps(attrs, errors)
        # rule 2
        self._validate_airports(attrs, errors)
        # rule 3
        self._validate_fleet_item(attrs, errors)


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

    def _validate_fleet_item(self, attrs, errors):
        fleet_item = attrs.get("airplane")
        airline = attrs.get('airline_name')
        if fleet_item.airline != airline:
            errors['fleet_item'] = "Fleet item have to reference to the same airline as the flight"


class TicketSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ticket
        fields = [
            "id", "flight_number", "booking", "passenger_name", "flight_seat",
            "price", "ticket_status"
        ]
        read_only_fields = ["id", "ticket_status"]
    

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user", "created_at", "status", "total_price"]

class BookingCreateSerializer(serializers.Serializer):
    ticket_ids = serializers.ListField(
        child = serializers.IntegerField(min_value=1)
    )
    def create(self, validated_data):
        user = self.context['request'].user
        return create_booking(user, validated_data['ticket_ids'])

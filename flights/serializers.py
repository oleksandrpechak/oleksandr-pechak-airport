from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import Flight, Ticket, AirplaneSeat, Booking


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = [
            "id", "flight_number", "departure_airport", "arrival_airport",
            "departure_time", "arrival_time", "available_tickets",
            "ticket_price", "airline_name", "flight_status"
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
        # rule 3
        self._validate_available_tickets(attrs, errors)

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

    def _validate_available_tickets(self, attrs, errors):
        avb_tickets = attrs.get("available_tickets")
        fli_status = attrs.get("flight_status")
        if avb_tickets is None or fli_status is None:
            return

        if fli_status != Flight.FlightStatus.SCHEDULED and avb_tickets > 0:
            errors['available_tickets'] = (
                "Cannot have available tickets when "
                f"the flight status is '{fli_status}'."
                )





class TicketCreateSerializer(serializers.ModelSerializer):
    flight_number = serializers.SlugRelatedField(
        slug_field='flight_number',
        queryset=Flight.objects.all()
        )
    seat = serializers.CharField()

    class Meta:
        model = Ticket
        fields = ['flight_number', 'seat']
        validators = [
            UniqueTogetherValidator(
                queryset=Ticket.objects.all(),
                fields=['flight_number', 'seat'],
                message="This seat is already occupied on this flight."
            )
        ]    

    def validate(self, attrs):
        flight_instance = attrs["flight_number"]

        if flight_instance.flight_status != Flight.FlightStatus.SCHEDULED:
            raise serializers.ValidationError(
                {"flight_number": f"Booking is closed for flight {flight_instance.flight_number} "
                f"because it is currently {flight_instance.get_flight_status_display()}."}
            )

        if flight_instance.available_tickets <= 0:
            raise serializers.ValidationError(
                {"flight_number": f"No tickets available for flight {flight_instance.flight_number}."}
            )
        return attrs



class TicketSerializer(serializers.ModelSerializer):
    flight_number = serializers.SlugRelatedField(
        slug_field='flight_number',
        read_only=True
    )


    class Meta:
        model = Ticket
        fields = [
            "id", "flight_number", "client",
            "seat", "ticket_status"
        ]
        read_only_fields = ["id", "ticket_status"]
    


class AirplaneSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirplaneSeat
        fields = ["id", "flight_number", "row", "seat", "class_type" ]

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user_id", "status", "created_at"]
from decimal import Decimal
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Flight, Ticket, Booking
from aviation.models import Airport, Airline, FleetItem
from payments.models import Payment
from .services.flight_service import (
    create_flight_with_tickets, create_booking, calculate_price, BOOKING_PAYMENT_WINDOW
)

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
        self._validate_timestamps(attrs, errors)
        self._validate_airports(attrs, errors)
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
        if fleet_item and airline and fleet_item.airline != airline:
            errors['fleet_item'] = "Fleet item have to reference to the same airline as the flight"


class FlightAirportSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source="city.city")
    country_code = serializers.CharField(source="city.country.code")
    class Meta:
        model = Airport
        fields = ["id", "name", "iata_code", "city", "country_code"]


class FlightAirlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airline
        fields = ["id", "name"]


class FlightAirplaneSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source="airplane.brand")
    model = serializers.CharField(source="airplane.model")
    class Meta:
        model = FleetItem
        fields = ["id", "tail_number", "brand", "model"]


class FlightReadSerializer(serializers.ModelSerializer):
    """
    Flight as shown to passengers and in lists: related objects nested,
    business price computed, available_seats annotated by the viewset.
    """
    departure_airport = FlightAirportSerializer()
    arrival_airport = FlightAirportSerializer()
    airline_name = FlightAirlineSerializer()
    airplane = FlightAirplaneSerializer()
    business_price = serializers.SerializerMethodField()
    available_seats = serializers.IntegerField(read_only=True)

    class Meta:
        model = Flight
        fields = [
            "id", "flight_number", "departure_airport", "arrival_airport",
            "departure_time", "arrival_time", "ticket_price", "business_price",
            "business_percent", "airline_name", "airplane", "flight_status",
            "available_seats", "created_at",
        ]

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_business_price(self, flight):
        price = calculate_price(flight.ticket_price, "BUSINESS", flight)
        return str(price.quantize(Decimal("0.01")))


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "id", "flight_number", "booking", "passenger_name", "flight_seat",
            "price", "ticket_status"
        ]
        read_only_fields = ["id", "ticket_status"]
    

class BookingTicketSerializer(serializers.ModelSerializer):
    flight_id = serializers.IntegerField(source="flight_number.id")
    flight_number = serializers.CharField(source="flight_number.flight_number")
    departure_iata = serializers.CharField(source="flight_number.departure_airport.iata_code")
    arrival_iata = serializers.CharField(source="flight_number.arrival_airport.iata_code")
    departure_time = serializers.DateTimeField(source="flight_number.departure_time")
    arrival_time = serializers.DateTimeField(source="flight_number.arrival_time")
    row = serializers.IntegerField(source="flight_seat.row")
    seat = serializers.CharField(source="flight_seat.seat")
    class_type = serializers.CharField(source="flight_seat.class_type")
    class Meta:
        model = Ticket
        fields = [
            "id", "flight_id", "flight_number", "departure_iata", "arrival_iata",
            "departure_time", "arrival_time", "row", "seat", "class_type",
            "price", "ticket_status",
        ]


class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "status", "amount", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    tickets = BookingTicketSerializer(many=True, read_only=True)
    payment = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "user", "created_at", "status", "total_price",
            "expires_at", "tickets", "payment",
        ]
        read_only_fields = fields

    @extend_schema_field(BookingPaymentSerializer(allow_null=True))
    def get_payment(self, booking):
        payment = getattr(booking, "payment", None)
        return BookingPaymentSerializer(payment).data if payment else None

    @extend_schema_field(serializers.DateTimeField(allow_null=True))
    def get_expires_at(self, booking):
        if booking.status != Booking.BookingStatus.PENDING:
            return None
        return serializers.DateTimeField().to_representation(
            booking.created_at + BOOKING_PAYMENT_WINDOW
        )

class BookingCreateSerializer(serializers.Serializer):
    ticket_ids = serializers.ListField(
        child = serializers.IntegerField(min_value=1)
    )
    def create(self, validated_data):
        user = self.context['request'].user
        return create_booking(user, validated_data['ticket_ids'])

class SeatMapSerializer(serializers.ModelSerializer):
    row = serializers.IntegerField(source="flight_seat.row")
    seat = serializers.CharField(source="flight_seat.seat")
    class_type = serializers.CharField(source="flight_seat.class_type")
    class Meta:
        model = Ticket
        fields = ['id', 'flight_seat', 'row', 'seat', 'class_type', 'price', 'ticket_status']
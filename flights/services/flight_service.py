from ..models import Flight, Ticket
from  aviation.models import AirplaneSeat
from decimal import Decimal
from django.db import transaction

CLASS_PRICE_MULTIPLIERS = {
    'ECONOMY': 1.0,
    'BUSINESS': 2.0,
    }

def calculate_price(base_price: Decimal, class_type: str) -> Decimal:
    multiplier = CLASS_PRICE_MULTIPLIERS[class_type]
    return base_price * multiplier

def create_flight_with_tickets(flight_data: dict):
    with transaction.atomic():
        flight = Flight.objects.create(**flight_data)
        seats = AirplaneSeat.objects.filter(airplane=flight.airplane)

        Ticket.objects.bulk_create([
            Ticket(flight=flight, seat=seat, price=calculate_price(
                flight.ticket_price, seat.class_type
                ))
            for seat in seats
            ])
        return flight
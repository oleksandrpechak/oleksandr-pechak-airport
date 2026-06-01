from ..models import Flight, Ticket, Booking
from  aviation.models import AirplaneSeat
from users.models import CustomUser
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum



def calculate_price(base_price: Decimal, class_type: str, flight: Flight) -> Decimal:
    CLASS_PRICE_MULTIPLIERS = {
    'ECONOMY': Decimal('1'),
    'BUSINESS': Decimal('1') + Decimal(flight.business_percent) / Decimal(100) ,
    }
    multiplier = CLASS_PRICE_MULTIPLIERS[class_type]
    return base_price * multiplier

def create_flight_with_tickets(flight_data: dict):
    with transaction.atomic():
        flight = Flight.objects.create(**flight_data)
        seats = AirplaneSeat.objects.filter(airplane=flight.airplane.airplane)
        print(f"Found {seats.count()} seats")
        print(f"Flight airplane: {flight.airplane}")
        print(f"Flight airplane.airplane: {flight.airplane.airplane}")
        Ticket.objects.bulk_create([
            Ticket(flight_number=flight, flight_seat=seat, price=calculate_price(
                flight.ticket_price, seat.class_type, flight
                ))
            for seat in seats
            ])
        return flight



def create_booking(user, ticket_ids: list) -> Booking:
    with transaction.atomic():
        tickets = Ticket.objects.filter(id__in = ticket_ids)

        existing_ids = tickets.values_list('id', flat=True)
        missing_ids = set(ticket_ids) - set(existing_ids)
        if missing_ids:
            raise ValueError(f"Tickets {list(missing_ids)} do not exist")
        
        unavailable = tickets.exclude(ticket_status="AVAILABLE").values_list('id', flat=True)
        if unavailable.exists():
            raise ValueError(f"Tickets {list(unavailable)} are not available")
        
        booking = Booking.objects.create(
            user=user,
            total_price = tickets.aggregate(total = Sum('price'))['total']
            )

        tickets.update(ticket_status = "BOOKED", booking=booking, passenger_name = user)

        return booking
    

def cancel_booking(user, booking_id: int) -> Booking:
    with transaction.atomic():
        booking = Booking.objects.get(id = booking_id)

        if booking.user != user:
            raise ValueError(f'This booking_id does not belong to user {user}')
        if booking.status == "CANCELLED":
            raise ValueError(f'Booking {booking_id} has already been calcelled')
        
        booking.status = "CANCELLED"
        booking.save()

        tickets = Ticket.objects.filter(booking_id = booking_id)
        tickets.update(ticket_status ="AVAILABLE")

        return booking
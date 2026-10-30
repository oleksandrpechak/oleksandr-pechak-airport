from flights.models import Flight, Ticket, Booking
from aviation.models import AirplaneSeat
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from decimal import Decimal
from datetime import timedelta
from django.db import transaction
import logging
from flights.tasks import cancel_unpaid_booking


logger = logging.getLogger(__name__)

# Unpaid bookings are cancelled after this window (see flights.tasks).
BOOKING_PAYMENT_WINDOW = timedelta(minutes=30)


def calculate_price(base_price: Decimal, class_type: str, flight: Flight) -> Decimal:
    CLASS_PRICE_MULTIPLIERS = {
    'ECONOMY': Decimal('1'),
    'BUSINESS': Decimal('1') + Decimal(flight.business_percent) / Decimal(100) ,
    }
    multiplier = CLASS_PRICE_MULTIPLIERS[class_type]
    return base_price * multiplier

def create_flight_with_tickets(flight_data: dict):
    try:
        with transaction.atomic():
            flight = Flight.objects.create(**flight_data)
            seats = AirplaneSeat.objects.filter(airplane=flight.airplane.airplane)
            logger.info(f"Found {seats.count()} seats for {flight.id} ")
            Ticket.objects.bulk_create([
                Ticket(flight_number=flight, flight_seat=seat, price=calculate_price(
                    flight.ticket_price, seat.class_type, flight
                    ))
                for seat in seats
                ])
            logger.info(f"Flight created successfully: flight_id: {flight.id} seats: {seats.count()}")
            return flight
    except Exception:
        logger.exception(
            "Failed to create flight and tickets"
        )
        raise


def create_booking(user, ticket_ids: list) -> Booking:
    try:
        with transaction.atomic():
            tickets = list(
                Ticket.objects.select_for_update()
                .filter(id__in = ticket_ids)
                .order_by('id')
            )
            logger.info(f"User {user} started to book these tickets {ticket_ids}")
            if not ticket_ids:
                raise ValidationError("At least one ticket is required")
            existing_ids = {ticket.id for ticket in tickets}
            missing_ids = set(ticket_ids) - existing_ids
            if missing_ids:
                raise ValidationError(f"Tickets {list(missing_ids)} do not exist")
            
            unavailable = [
                ticket.id for ticket in tickets
                if ticket.ticket_status != "AVAILABLE"
            ]
            if unavailable:
                raise ValidationError(f"Tickets {unavailable} are not available")
            
            booking = Booking.objects.create(
                user=user,
                total_price = sum(ticket.price for ticket in tickets)
                )
            Ticket.objects.filter(id__in = existing_ids).update(
                ticket_status = "BOOKED", booking=booking, passenger_name = user
            )
            transaction.on_commit(
                lambda: cancel_unpaid_booking.apply_async(
                    args=[booking.id],
                    countdown=int(BOOKING_PAYMENT_WINDOW.total_seconds())
                )
            )
            logger.info(f"Booking with id:{booking.id} successfuly created by: {user}")
            return booking
    except Exception:
        logger.exception(
            f"Failed to create booking for tickets {ticket_ids}"
        )
        raise
    

def cancel_booking(user, booking_id: int) -> Booking:
    try:
        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(id = booking_id).first()
            logger.info(f"User {user} started to cancel booking with id: {booking_id} ")
            if booking is None:
                raise NotFound(f"Booking {booking_id} not found")
            if booking.user != user:
                raise PermissionDenied(f'This booking_id does not belong to user {user}')
            if booking.status == "CANCELLED":
                raise ValidationError(f'Booking {booking_id} has already been calcelled')
            
            booking.status = "CANCELLED"
            booking.save()

            tickets = Ticket.objects.filter(booking_id = booking_id)
            tickets.update(ticket_status ="AVAILABLE")

            return booking
    except Exception:
        logger.exception(f"Failed to cancel booking with id {booking_id}")
        raise
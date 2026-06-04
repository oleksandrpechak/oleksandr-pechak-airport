from celery import shared_task
from .models import Booking, Ticket
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
import logging


logger = logging.getLogger(__name__)

@shared_task
def cancel_unpaid_booking(booking_id):
    try:
        with transaction.atomic():
            booking = Booking.objects.get(id = booking_id)
            logging.info(
                f"Celery start process of cancelling booking with id{booking_id} due to expired pending session"
                )
            if booking.status == "PENDING":
                booking.status = "CANCELLED"
                booking.save()
                tickets = Ticket.objects.filter(booking_id = booking_id)
                tickets.update(ticket_status = "AVAILABLE")
    except Exception:
        logger.exception(f"Celery failed to cancel booking_id:{booking_id}")
        raise
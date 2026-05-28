from django.db import models


class Flight(models.Model):
    flight_number = models.CharField(max_length=5)
    departure_airport = models.ForeignKey(
        "aviation.Airport", on_delete=models.PROTECT,
        related_name="departures"
    )
    arrival_airport = models.ForeignKey(
        "aviation.Airport", on_delete=models.PROTECT,
        related_name="arrivals"
    )
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    available_tickets = models.PositiveIntegerField()
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2
        )
    airline_name = models.ForeignKey(
        "aviation.Airline", on_delete=models.PROTECT
    )
    class FlightStatus(models.TextChoices):
        SCHEDULED = "SCHEDULED", "scheduled"
        BOARDING = "BOARDING", "boarding"
        DEPARTED = "DEPARTED", "departed"
        DELAYED = "DELAYED", "delayed"
        CANCELLED = "CANCELLED", "cancelled"
    flight_status = models.CharField(
        max_length=10,
        choices=FlightStatus.choices,
        default=FlightStatus.SCHEDULED
    )


class AirplaneSeat(models.Model):
    flight_number = models.ForeignKey(
        "Flight",
        on_delete=models.PROTECT,
        related_name="tickets"
    )
    row = models.PositiveIntegerField(min_value=1)
    seat = models.PositiveIntegerField(min_value=1)

    class ClassType(models.TextChoices):
        PREMIUM = "PREMIUM", "premium"
        BASIC = "BASIC", "basic"

    class_type = models.CharField(
        max_length=7,
        choices=ClassType.choices,
        default=ClassType.BASIC
    )


class Booking(models.Model):
    user_id = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE
    )

    class BookingStatus(models.TextChoices):
        PENDING = "PENDING", "pending"
        CONFIRMED = "CONFIRMED", "confirmed"
        CANCELLED = "CANCELLED", "cancelled"
        EXPIRED = "EXPIRED", "expired"
    status = models.CharField(
        max_length=10,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    




class Ticket(models.Model):
    booking = models.ForeignKey(
        "Booking",
        on_delete=models.CASCADE,
        related_name="tickets"
    )
    flight_number = models.ForeignKey(
        "Flight",
        on_delete=models.PROTECT,
        related_name="tickets"

    )
    client_name = models.ForeignKey(
        "users.CustomUser", on_delete=models.CASCADE
    )
    airplane_seat = models.ForeignKey(
        "AirplaneSeat", on_delete=models.CASCADE
    )
    class TicketStatus(models.TextChoices):
        BOOKED = "BOOKED", "booked"
        USED = "USED", "used"
        PAID = "PAID", "paid"
        CANCELLED = "CANCELLED", "cancelled"
    ticket_status = models.CharField(
        max_length=10,
        choices=TicketStatus.choices,
        default=TicketStatus.BOOKED
    )

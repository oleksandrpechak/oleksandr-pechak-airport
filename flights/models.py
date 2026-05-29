from django.db import models

class FlightStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "scheduled"
    BOARDING = "BOARDING", "boarding"
    DEPARTED = "DEPARTED", "departed"
    DELAYED = "DELAYED", "delayed"
    CANCELLED = "CANCELLED", "cancelled"

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
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2
        )
    airplane = models.ForeignKey(
        "aviation.FleetItem", on_delete=models.PROTECT
    )
    airline_name = models.ForeignKey(
        "aviation.Airline", on_delete=models.PROTECT
    )
    flight_status = models.CharField(
        max_length=10,
        choices=FlightStatus.choices,
        default=FlightStatus.SCHEDULED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.departure_airport} >> {self.arrival_airport}"


class BookingStatus(models.TextChoices):
    PENDING = "PENDING", "pending"
    CONFIRMED = "CONFIRMED", "confirmed"
    CANCELLED = "CANCELLED", "cancelled"

class Booking(models.Model):
    user_id = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=10,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    created_at = models.DateTimeField(auto_now_add=True)


class TicketStatus(models.TextChoices):
    BOOKED = "BOOKED", "booked"
    USED = "USED", "used"
    PAID = "PAID", "paid"
    CANCELLED = "CANCELLED", "cancelled"

class Ticket(models.Model):
    flight_number = models.ForeignKey(
        "flights.Flight",
        on_delete=models.CASCADE,
        related_name="tickets"
    )
    booking = models.ForeignKey(
        "Booking",
        on_delete=models.CASCADE,
        related_name="tickets"
    )
    passenger_name = models.ForeignKey(
        "users.CustomUser", on_delete=models.CASCADE
    )
    flight_seat = models.OneToOneField(
        "aviation.AirplaneSeat", on_delete=models.CASCADE
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    ticket_status = models.CharField(
        max_length=10,
        choices=TicketStatus.choices,
        default=TicketStatus.BOOKED
    )
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['flight_number','flight_seat'],
                name="unique_ticket"
                )
        ]
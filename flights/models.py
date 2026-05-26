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
        SCHEDULED = "SCH", "scheduled"
        BOARDING = "BRG", "boarding"
        DEPARTED = "DEP", "departed"
        DELAYED = "DLD", "delayed"
        CANCELLED = "CND", "cancelled"
    flight_status = models.CharField(
        max_length=3,
        choices=FlightStatus.choices,
        default=FlightStatus.SCHEDULED
    )

class Ticket(models.Model):
    flight_number = models.ForeignKey(
        "Flight", on_delete=models.PROTECT
    )
    client = models.ForeignKey(
        "users.CustomUser", on_delete=models.CASCADE
    )
    seat = models.CharField(max_length=10)
    class TicketStatus(models.TextChoices):
        BOOKED = "BKD", "booked"
        USED = "USE", "used"
        PAID = "PAD", "paid"
        CANCELLED = "CND", "cancelled"
    ticket_status = models.CharField(
        max_length=3,
        choices=TicketStatus.choices,
        default=TicketStatus.BOOKED
    )
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['flight', 'seat'], 
                name='unique_flight_id_seat'
            )
        ]
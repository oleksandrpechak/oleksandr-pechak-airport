from django.db import models


class Flight(models.Model):
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
    airline_name = models.ForeignKey(
        "aviation.Airline", on_delete=models.PROTECT
    )
    airplane_seats = models.ForeignKey(
        "aviation.Airplane", on_delete=models.PROTECT,
        related_name="flight_seats"
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
    flight_id = models.ForeignKey(
        "Flight", on_delete=models.PROTECT
    )
    client_id = models.ForeignKey(
        "users.CustomUser", on_delete=models.CASCADE
    )
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )
    class TicketStatus(models.TextChoices):
        AVAILABLE = "AVB", "available"
        BOOKED = "BKD", "booked"
        USED = "USE", "used"
        PAID = "PAD", "paid"
        CANCELLED = "CND", "cancelled"
    ticket_status = models.CharField(
        max_length=3,
        choices=TicketStatus.choices,
        default=TicketStatus.AVAILABLE
    )
from django.db import models
from django.db.models import Sum


class Airplane(models.Model):
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    seats = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["brand", "model"],
                name="unique_brand_model"
            )
        ]

    @property
    def is_large_aircraft(self):
        return self.seats > 250

    def __str__(self):
        return self.brand + " " + self.model

class Fleet(models.Model):
    airline = models.ForeignKey(
        "Airline", on_delete=models.CASCADE
        )
    airplane = models.ForeignKey(
        "Airplane", on_delete=models.CASCADE
    )
    fleet_size = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["airline", "airplane"],
                name = "unique_airline_airplane"
            )
        ]


class Airline(models.Model):
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    founded_year = models.IntegerField(null=True, blank=True)

    @property
    def total_airplanes(self):
        return self.fleets.aggregate(
            Sum("fleet_size")
        )["total"] or 0

    def __str__(self):
        return self.name 


class Airport(models.Model):
    airport_name = models.CharField(max_length=200)
    iata_code = models.CharField(max_length=3, unique=True)
    city = models.ForeignKey(
        "locations.City", on_delete=models.CASCADE
    )
    airline = models.ManyToManyField(
        "Airline", related_name="airports"
    )
    def __str__(self):
        return self.airport_name
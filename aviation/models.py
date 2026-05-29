from django.db import models



class Airplane(models.Model):
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    rows = models.PositiveIntegerField()
    seats_per_row = models.PositiveIntegerField()
    def total_seats(self):
        return self.rows * self.seats_per_row

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["brand", "model"],
                name="unique_brand_model"
            )
        ]
    def __str__(self):
        return self.brand + " " + self.model


class AirplaneSeat(models.Model):
    airplane = models.ForeignKey(
        "Airplane",
        on_delete=models.CASCADE,
        related_name="airplane"
    )
    row = models.PositiveIntegerField()
    seat = models.CharField(max_length=10)

    class ClassType(models.TextChoices):
        BUSINESS = "BUSINESS", "business"
        ECONOMY = "ECONOMY", "economy"
    class_type = models.CharField(
        max_length=10,
        choices=ClassType.choices,
        default=ClassType.ECONOMY
    )

class Airline(models.Model):
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    founded_year = models.IntegerField(null=True, blank=True)
    def __str__(self):
        return self.name 

class FleetItem(models.Model):
    tail_number = models.CharField(max_length=8, unique=True)
    airplane = models.ForeignKey(
        "Airplane",
        on_delete=models.CASCADE)
    airline = models.ForeignKey(
        "Airline",
        on_delete=models.CASCADE
    )
class Airport(models.Model):
    name = models.CharField(max_length=200)
    iata_code = models.CharField(max_length=3, unique=True)
    city = models.ForeignKey(
        "locations.City", on_delete=models.CASCADE
    )
    airline = models.ManyToManyField(
        "Airline", related_name="airports"
    )
    def __str__(self):
        return self.name
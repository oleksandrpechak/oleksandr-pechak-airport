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


class Airline(models.Model):
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    founded_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name 


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
        return self.airport_name
from django.db import models


class Airplanes(models.Model):
    airplane_brand = models.CharField(max_length=50)
    airplane_model = models.CharField(max_length=100)

class Airlines(models.Model):
    airline_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    airplane_capacity = models.PositiveIntegerField()
    founded_year = models.IntegerField(null=True, blank=True)

class Fleets(models.Model):
    airline_name = models.ForeignKey(
        "Airlines", on_delete=models.CASCADE
        )
    airplane_name = models.ForeignKey(
        "Airplanes", on_delete=models.CASCADE
    )
    fleet_size = models.PositiveIntegerField()

class Airports(models.Model):
    airport_name = models.CharField(max_length=200)
    iata_code = models.CharField(max_length=3, unique=True)
    city = models.ForeignKey(
        "locations.Cities", on_delete=models.CASCADE
    )
    country = models.ForeignKey(
        "locations.Countries", on_delete=models.CASCADE
    )

class AirportsAirlines(models.Model):
    airport_name = models.ForeignKey(
        "Airports", on_delete=models.CASCADE
    )
    airline_name = models.ForeignKey(
        "Airlines", on_delete=models.CASCADE
    )
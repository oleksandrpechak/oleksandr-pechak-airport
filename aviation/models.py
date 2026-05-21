from django.db import models


class Airplane(models.Model):
    airplane_brand = models.CharField(max_length=50)
    airplane_model = models.CharField(max_length=100)

class Airline(models.Model):
    airline_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    airplane_capacity = models.PositiveIntegerField()
    founded_year = models.IntegerField(null=True, blank=True)

class Fleet(models.Model):
    airline_name = models.ForeignKey(
        "Airline", on_delete=models.CASCADE
        )
    airplane_name = models.ForeignKey(
        "Airplane", on_delete=models.CASCADE
    )
    fleet_size = models.PositiveIntegerField()

class Airport(models.Model):
    airport_name = models.CharField(max_length=200)
    iata_code = models.CharField(max_length=3, unique=True)
    city = models.ForeignKey(
        "locations.City", on_delete=models.CASCADE
    )
    country = models.ForeignKey(
        "locations.Country", on_delete=models.CASCADE
    )

class AirportAirline(models.Model):
    airport_name = models.ForeignKey(
        "Airport", on_delete=models.CASCADE
    )
    airline_name = models.ForeignKey(
        "Airline", on_delete=models.CASCADE
    )
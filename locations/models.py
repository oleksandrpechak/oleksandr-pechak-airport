from django.db import models


class Country(models.Model):
    country = models.CharField(max_length=56)
    code = models.CharField(max_length=2)

class City(models.Model):
    city = models.CharField(max_length=150)
    country = models.ForeignKey(
        "Country", on_delete=models.CASCADE
    )
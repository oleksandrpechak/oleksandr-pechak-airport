from django.db import models


class Countries(models.Model):
    country = models.CharField(max_length=56)
    code = models.CharField(max_length=2)

class Cities(models.Model):
    city = models.CharField(max_length=150)
    country = models.ForeignKey(
        "Countries", on_delete=models.CASCADE
    )
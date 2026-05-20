from django.db import models
# my code
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        USER = "USER", "User"
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.USER
    )


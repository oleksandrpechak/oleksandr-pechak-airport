from django.db import models


class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "pending"
        COMPLETED = "COMPLETED", "completed"
        FAILED = "FAILED", "fail",
        EXPIRED = "EXPIRED", "expired"

    booking = models.OneToOneField(
        "flights.Booking",
        on_delete=models.CASCADE,
        related_name="payment"
    )
    stripe_session_id = models.CharField(
        max_length=255,
        unique=True
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)


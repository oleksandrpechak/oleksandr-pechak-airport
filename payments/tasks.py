from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_ticket_email(email):
    send_mail(
        subject="Flight ticket",
        message="Your payment was successful.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
    )
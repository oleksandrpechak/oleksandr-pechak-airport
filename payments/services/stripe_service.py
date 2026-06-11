import stripe
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(booking):
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': settings.DEFAULT_CURRENCY,
                'product_data': {
                    'name': f'Booking #{booking.id}',
                },
                'unit_amount': int(booking.total_price * 100),
            },
            'quantity': settings.PAYMENT_QUANTITY,
        }],
        mode='payment',
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
        metadata={'booking_id': booking.id},
        expires_at=int((timezone.now() + timedelta(minutes=30)).timestamp())
    )
    return session
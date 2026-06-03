import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(booking):
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': f'Booking #{booking.id}',
                },
                'unit_amount': int(booking.total_price * 100),
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url='http://localhost:8000/api/payments/success/',
        cancel_url='http://localhost:8000/api/payments/cancel/',
        metadata={'booking_id': booking.id}
    )
    return session
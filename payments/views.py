import stripe
from django.conf import settings
from rest_framework.views import APIView
from .models import Payment
from flights.models import Booking, Ticket
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer
from .services.stripe_service import create_checkout_session
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from payments.tasks import send_ticket_email
import logging
from rest_framework.throttling import UserRateThrottle


logger = logging.getLogger(__name__)

class PaymentThrottle(UserRateThrottle):
    rate = '10/hour'


class PaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        try:
            payment = Payment.objects.get(id=pk)
        except Payment.DoesNotExist:
            logger.warning(f'Payment with id {pk} does not exist')
            return Response (
                {'detail': f'Payment with id {pk} does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )
        if payment.booking.user != request.user:
            return Response (
                {'detail': 'You do not have permission to check this payment.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

class PaymentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentThrottle]
    def post(self,request, booking_id=None):
        try:
            booking = Booking.objects.get(id = booking_id) 
        except Booking.DoesNotExist:
            logger.warning(f"Booking with id {booking_id} does not exist.")
            return Response (
                {'detail': f'Booking with id {booking_id} does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if Payment.objects.filter(booking=booking).exists():
            return Response(
                {'detail': 'Payment for this booking already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        session = create_checkout_session(booking)
        Payment.objects.create(
            booking = booking,
            amount = booking.total_price,
            stripe_session_id = session.id 
        )
        return Response({'chekout_url': session.url}, status=status.HTTP_200_OK)
        
    
class WebhookView(APIView):
    permission_classes= [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            booking_id = session['metadata']['booking_id']
            with transaction.atomic():
                booking = Booking.objects.get(id = booking_id)
                booking.status = Booking.BookingStatus.CONFIRMED
                booking.save()
                tickets = Ticket.objects.filter(booking_id = booking_id)
                tickets.update(ticket_status = Ticket.TicketStatus.PAID)
                Payment.objects.filter(booking=booking).update(status =Payment.PaymentStatus.COMPLETED)
                transaction.on_commit(
                    lambda: send_ticket_email.delay(
                        booking.user.email
                    )
                )
        elif event['type'] == 'checkout.session.expired':
            session = event['data']['object']
            booking_id = session['metadata']['booking_id']
            with transaction.atomic():
                booking = Booking.objects.get(id = booking_id)
                booking.status = Booking.BookingStatus.CANCELLED
                booking.save()
                tickets = Ticket.objects.filter(booking_id = booking_id)
                tickets.update(ticket_status = Ticket.TicketStatus.AVAILABLE)
                Payment.objects.filter(booking=booking).update(status = Payment.PaymentStatus.EXPIRED)
        return Response(status=status.HTTP_200_OK)


class PaymentSuccessView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'detail': 'Payment successful'}, status=status.HTTP_200_OK)
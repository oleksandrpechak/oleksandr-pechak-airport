import stripe
from django.conf import settings
from rest_framework.views import APIView
from .models import Payment
from flights.models import Booking, Ticket
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer
from .services.stripe_service import create_checkout_session, retrieve_checkout_session
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from payments.tasks import send_ticket_email
import logging
from rest_framework.throttling import UserRateThrottle
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer


logger = logging.getLogger(__name__)

class PaymentThrottle(UserRateThrottle):
    rate = '10/hour'


class PaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=PaymentSerializer)
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
    @extend_schema(
        request=None,
        responses=inline_serializer(
            "CheckoutSession", {"chekout_url": serializers.URLField()}
        ),
    )
    def post(self,request, booking_id=None):
        # The row lock serialises concurrent "Pay" clicks for the same booking,
        # so only one of them can create the Payment row.
        with transaction.atomic():
            booking = (
                Booking.objects.select_for_update()
                .filter(id = booking_id, user = request.user)
                .first()
            )
            if booking is None:
                logger.warning(f"Booking with id {booking_id} does not exist.")
                return Response (
                    {'detail': f'Booking with id {booking_id} does not exist.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return self._checkout(booking)

    def _checkout(self, booking):
        if booking.status != Booking.BookingStatus.PENDING:
            return Response(
                {'detail': f'Booking is {booking.get_status_display()} and cannot be paid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = Payment.objects.filter(booking=booking).first()
        if payment is None:
            session = create_checkout_session(booking)
            Payment.objects.create(
                booking = booking,
                amount = booking.total_price,
                stripe_session_id = session.id 
            )
            return Response({'chekout_url': session.url}, status=status.HTTP_200_OK)

        if payment.status == Payment.PaymentStatus.COMPLETED:
            return Response(
                {'detail': 'Payment for this booking is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if payment.status == Payment.PaymentStatus.PENDING:
            existing_session = retrieve_checkout_session(payment.stripe_session_id)
            if existing_session.status == 'open':
                return Response(
                    {'chekout_url': existing_session.url}, status=status.HTTP_200_OK
                )
        session = create_checkout_session(booking)
        payment.stripe_session_id = session.id
        payment.amount = booking.total_price
        payment.status = Payment.PaymentStatus.PENDING
        payment.save()
        return Response({'chekout_url': session.url}, status=status.HTTP_200_OK)
        
    
class WebhookView(APIView):
    permission_classes= [AllowAny]

    @extend_schema(exclude=True)
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
            self._handle_session_completed(event['data']['object'])
        elif event['type'] == 'checkout.session.expired':
            self._handle_session_expired(event['data']['object'])
        return Response(status=status.HTTP_200_OK)

    def _lock_booking(self, booking_id):
        booking = Booking.objects.select_for_update().filter(id = booking_id).first()
        if booking is None:
            logger.warning(f"Webhook received for unknown booking {booking_id}")
        return booking

    def _handle_session_completed(self, session):
        booking_id = session['metadata']['booking_id']
        with transaction.atomic():
            booking = self._lock_booking(booking_id)
            if booking is None:
                return
            if booking.status == Booking.BookingStatus.CONFIRMED:
                logger.info(f"Booking {booking_id} already confirmed, ignoring repeated webhook")
                return
            if booking.status != Booking.BookingStatus.PENDING:
                logger.error(
                    f"Payment completed for booking {booking_id} in status {booking.status}; "
                    f"booking not confirmed, payment needs a manual refund"
                )
                return
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

    def _handle_session_expired(self, session):
        booking_id = session['metadata']['booking_id']
        with transaction.atomic():
            booking = self._lock_booking(booking_id)
            if booking is None or booking.status != Booking.BookingStatus.PENDING:
                return
            payment = Payment.objects.filter(booking=booking).first()
            if payment is None or payment.stripe_session_id != session.get('id'):
                logger.info(f"Ignoring expiry of stale checkout session for booking {booking_id}")
                return
            booking.status = Booking.BookingStatus.CANCELLED
            booking.save()
            tickets = Ticket.objects.filter(booking_id = booking_id)
            tickets.update(ticket_status = Ticket.TicketStatus.AVAILABLE)
            payment.status = Payment.PaymentStatus.EXPIRED
            payment.save(update_fields=["status"])


class PaymentSuccessView(APIView):
    permission_classes = [AllowAny]
    
    @extend_schema(
        responses=inline_serializer("PaymentSuccess", {"detail": serializers.CharField()})
    )
    def get(self, request):
        return Response({'detail': 'Payment successful'}, status=status.HTTP_200_OK)
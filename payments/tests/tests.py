from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from flights.models import Ticket, Booking
from payments.models import Payment
from flights.services.flight_service import create_booking
from flights.tests.utils import create_test_flight
from unittest.mock import patch, MagicMock
from rest_framework import status
from decimal import Decimal


User = get_user_model()

class PaymentViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.user)
        
        self.flight = create_test_flight()
        self.tickets = Ticket.objects.filter(flight_number = self.flight)
        self.ticket_ids = list(self.tickets.values_list('id', flat=True)[:2])
        self.booking = create_booking(self.user, self.ticket_ids)

        self.url = f"/api/payments/pay/{self.booking.id}/"

    @patch('payments.views.create_checkout_session')
    def test_auth_user_can_create_payment(self, mock_create_checkout_session):
        mock_session = MagicMock()
        mock_session.id = "cs_test_123"
        mock_session.url = "https://checkout.stripe.com/test-session"
        mock_create_checkout_session.return_value = mock_session

        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_create_checkout_session.assert_called_once()
        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.stripe_session_id, "cs_test_123")
        self.assertEqual(payment.status, Payment.PaymentStatus.PENDING)
    def test_unauth_user_cannot_create_payment(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_non_existent_booking_returns_404(self):
        url = "/api/payments/pay/9999/"
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    @patch("payments.views.create_checkout_session")
    def test_duplicate_payment_returns_400(self, mock_create_checkout_session):
        Payment.objects.create(
            booking=self.booking,
            stripe_session_id="cs_existing",
            amount=Decimal("100.00"),
            status=Payment.PaymentStatus.PENDING
        )
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_create_checkout_session.assert_not_called()




class PaymentWebhookViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )

        self.flight = create_test_flight()
        self.tickets = Ticket.objects.filter(flight_number=self.flight)
        self.ticket_ids = list(self.tickets.values_list("id", flat=True)[:2])

        self.booking = create_booking(self.user, self.ticket_ids)

        self.payment = Payment.objects.create(
            booking=self.booking,
            stripe_session_id="cs_test_123",
            amount=Decimal("100.00"),
            status=Payment.PaymentStatus.PENDING
        )

        self.url = "/api/payments/webhook/"

    @patch("payments.views.stripe.Webhook.construct_event")
    def test_webhook_payment_completed(self, mock_construct_event):
        mock_construct_event.return_value = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {
                        "booking_id": self.booking.id
                    }
                }
            }
        }
        response = self.client.post(
            self.url,
            data={},
            format='json',
            HTTP_STRIPE_RESPONSE="test_signature"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.payment.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(self.payment.status, Payment.PaymentStatus.COMPLETED)
        tickets = Ticket.objects.filter(id__in=self.ticket_ids)
        self.assertTrue(all(ticket.ticket_status == Ticket.TicketStatus.PAID for ticket in tickets))
    @patch("payments.views.stripe.Webhook.construct_event")
    def test_webhook_payment_expired(self, mock_construct_event):
        mock_construct_event.return_value = {
            "type": "checkout.session.expired",
            "data": {
                "object": {
                    "metadata": {
                        "booking_id": self.booking.id
                    }
                }
            }
        }
        response = self.client.post(
            self.url,
            data={},
            format='json',
            HTTP_STRIPE_RESPONSE="test_signature"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.payment.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.CANCELLED)
        self.assertEqual(self.payment.status, Payment.PaymentStatus.EXPIRED)
        tickets = Ticket.objects.filter(id__in=self.ticket_ids)
        self.assertTrue(all(ticket.ticket_status == Ticket.TicketStatus.AVAILABLE for ticket in tickets))
    @patch("payments.views.send_ticket_email.delay")
    @patch("payments.views.stripe.Webhook.construct_event")
    def test_webhook_completed_sends_ticket_email(
        self, mock_construct_event, mock_send_ticket_email_delay,
    ):
        mock_construct_event.return_value = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {
                        "booking_id": self.booking.id
                    }
                }
            }
        }
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                "/api/payments/webhook/",
                data={},
                format="json",
                HTTP_STRIPE_SIGNATURE="test_signature",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        mock_send_ticket_email_delay.assert_called_once_with(
            self.booking.user.email
        )
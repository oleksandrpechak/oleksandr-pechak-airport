from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from flights.models import Ticket, Booking
from django.utils.timezone import now
from datetime import timedelta
from rest_framework import status
from flights.services.flight_service import create_booking, cancel_booking
from payments.models import Payment
from rest_framework.exceptions import ValidationError
from flights.tests.utils import create_test_flight
from unittest.mock import patch

User = get_user_model()

class FlightViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email= "testa@ta.com", password="testpass123")
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.admin)

        self.flight = create_test_flight()
        flight = self.flight
        self.valid_payload = {
            "flight_number": "LW999",
            "departure_airport": flight.departure_airport.id,
            "arrival_airport": flight.arrival_airport.id,
            "departure_time": (now() + timedelta(days=2)).isoformat(),
            "arrival_time": (now() + timedelta(days=2, hours=2)).isoformat(),
            "ticket_price": 200,
            "business_percent": 35,
            "airplane": flight.airplane.id,
            "airline_name": flight.airline_name.id,
        }
        self.url = "/api/flights/flights/"

    def test_anyone_can_list_flights(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_admin_can_create_flight_with_tickets(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ticket.objects.count(), 30*6 + 180)
    def test_unauthenticated_cannot_create_flight(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_non_admin_cannot_create_flight(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    def test_invalid_same_airports_gets_400(self):
        payload = self.valid_payload.copy()
        payload["arrival_airport"] = self.flight.departure_airport.id
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_invalid_arrival_time_before_departure_gets_400(self):
        payload = self.valid_payload.copy()
        payload["arrival_time"] = (now().isoformat())
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class BookingViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email= "testa@ta.com", password="testpass123")
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.user)
        
        self.flight = create_test_flight()
        self.departure_airport = self.flight.departure_airport
        self.arrival_airport = self.flight.arrival_airport
        self.tickets = Ticket.objects.filter(flight_number = self.flight)
        self.ticket_ids = list(self.tickets.values_list('id', flat=True)[:2])
        self.valid_payload ={
            "ticket_ids" : self.ticket_ids
        }
        self.url = "/api/flights/bookings/"
    def test_authenticated_user_can_create_booking(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    def test_unauthenticated_cannot_create_booking(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_booking_is_created_in_db(self):
        self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(Booking.objects.count(), 1)
    def test_user_can_cancel_own_booking(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.first()
        response = self.client.post(
            f"/api/flights/bookings/{booking.id}/cancel/",
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_cancel_unknown_booking_returns_404(self):
        response = self.client.post(
            "/api/flights/bookings/999999/cancel/",
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    @patch('flights.tasks.cancel_unpaid_booking.apply_async')
    def test_booking_creates_cancellation_task(self, mock_task):
        with self.captureOnCommitCallbacks(execute=True):
            booking = create_booking(self.user, self.ticket_ids)
        mock_task.assert_called_once_with(
            args=[booking.id], 
            countdown=1800
        )
    @patch('flights.tasks.cancel_unpaid_booking.apply_async')
    def test_cancellation_task_is_not_enqueued_before_commit(self, mock_task):
        with self.captureOnCommitCallbacks(execute=False) as callbacks:
            create_booking(self.user, self.ticket_ids)
        mock_task.assert_not_called()
        self.assertEqual(len(callbacks), 1)
    @patch('flights.tasks.cancel_unpaid_booking.apply_async')
    def test_cannot_book_already_booked_ticket(self, mock_task):
        create_booking(self.user, self.ticket_ids)
        user2 = User.objects.create_user(email="user2@us.com", password="testpass123")
        with self.captureOnCommitCallbacks(execute=True):
            with self.assertRaises(ValidationError):
                create_booking(user2, self.ticket_ids[:1])
        self.assertEqual(Booking.objects.count(), 1)
        self.assertEqual(
            Ticket.objects.get(id=self.ticket_ids[0]).passenger_name, self.user
        )
        mock_task.assert_not_called()
    def test_booking_already_booked_ticket_via_api_returns_400(self):
        self.client.post(self.url, self.valid_payload, format='json')
        user2 = User.objects.create_user(email="user2@us.com", password="testpass123")
        self.client.force_authenticate(user=user2)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_create_booking_with_missing_ticket_fails(self):
        with self.assertRaises(ValidationError):
            create_booking(self.user, [999999])
    def test_user_sees_only_own_bookings_in_list(self):
        other = User.objects.create_user(email="user2@us.com", password="testpass123")
        other_booking = create_booking(other, [self.ticket_ids[0]])
        own_booking = create_booking(self.user, [self.ticket_ids[1]])
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(own_booking.id, booking_ids)
        self.assertNotIn(other_booking.id, booking_ids)
    def test_user_cannot_retrieve_another_user_booking(self):
        other = User.objects.create_user(email="user2@us.com", password="testpass123")
        other_booking = create_booking(other, [self.ticket_ids[0]])
        response = self.client.get(f"{self.url}{other_booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    def test_user_can_retrieve_own_booking(self):
        booking = create_booking(self.user, self.ticket_ids)
        response = self.client.get(f"{self.url}{booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_admin_sees_all_bookings(self):
        booking = create_booking(self.user, self.ticket_ids)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(booking.id, booking_ids)
        response = self.client.get(f"{self.url}{booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_booking_cannot_be_patched(self):
        booking = create_booking(self.user, self.ticket_ids)
        response = self.client.patch(
            f"{self.url}{booking.id}/", {"status": "CONFIRMED"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.PENDING)
    def test_booking_cannot_be_put(self):
        booking = create_booking(self.user, self.ticket_ids)
        response = self.client.put(
            f"{self.url}{booking.id}/", {"status": "CONFIRMED"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    def test_booking_cannot_be_deleted(self):
        booking = create_booking(self.user, self.ticket_ids)
        response = self.client.delete(f"{self.url}{booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Booking.objects.filter(id=booking.id).exists())
    def test_create_booking_ignores_client_supplied_fields(self):
        payload = {
            **self.valid_payload,
            "status": "CONFIRMED",
            "total_price": "0.01",
            "user": self.admin.id,
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(id=response.data["id"])
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.status, Booking.BookingStatus.PENDING)
        self.assertGreater(booking.total_price, 1)


    
class TicketViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email= "testa@ta.com", password="testpass123")
        self.user2 = User.objects.create_user(email= "user2@ta.com", password="testpass123")
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.flight = create_test_flight()
        self.tickets = Ticket.objects.filter(flight_number = self.flight)
        ticket_ids = list(self.tickets.values_list('id', flat=True)[:2])
        self.booking = create_booking(self.user, ticket_ids)
        self.user_ticket = Ticket.objects.filter(booking = self.booking).first()

        self.url = "/api/flights/tickets/"
    def test_auth_user_can_list_their_tickets(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_unauth_user_cannot_list_ticekts(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_user_can_retrieve_their_ticket(self):
        response = self.client.get(f"{self.url}{self.user_ticket.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_user_cannot_retrieve_another_user_ticket(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f"{self.url}{self.user_ticket.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    def test_non_admin_cannot_delete_ticket(self):
        response = self.client.delete(f"{self.url}{self.user_ticket.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    def test_admin_can_delete_ticket(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"{self.url}{self.user_ticket.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

class FlightContractTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.flight = create_test_flight()
        self.url = "/api/flights/flights/"

    def test_flight_list_has_nested_details(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        flight = response.data["results"][0]
        self.assertEqual(flight["departure_airport"]["iata_code"], "TDA")
        self.assertEqual(flight["departure_airport"]["city"], "Lviv")
        self.assertEqual(flight["arrival_airport"]["iata_code"], "TAA")
        self.assertEqual(flight["airline_name"]["name"], "Test airline")
        self.assertEqual(flight["airplane"]["model"], "737")
        self.assertEqual(flight["available_seats"], 180)
        self.assertEqual(flight["business_price"], "270.00")
    def test_available_seats_drop_after_booking(self):
        ticket_ids = list(self.flight.tickets.values_list("id", flat=True)[:2])
        create_booking(self.user, ticket_ids)
        response = self.client.get(f"{self.url}{self.flight.id}/")
        self.assertEqual(response.data["available_seats"], 178)
    def test_filter_by_departure_iata(self):
        response = self.client.get(self.url, {"departure_iata": "tda"})
        self.assertEqual(response.data["count"], 1)
        response = self.client.get(self.url, {"departure_iata": "TAA"})
        self.assertEqual(response.data["count"], 0)
    def test_filter_by_departure_date(self):
        date = self.flight.departure_time.date().isoformat()
        response = self.client.get(self.url, {"departure_date": date})
        self.assertEqual(response.data["count"], 1)
    def test_filter_has_available_seats(self):
        self.flight.tickets.update(ticket_status=Ticket.TicketStatus.BOOKED)
        response = self.client.get(self.url, {"has_available_seats": "true"})
        self.assertEqual(response.data["count"], 0)
        response = self.client.get(self.url, {"has_available_seats": "false"})
        self.assertEqual(response.data["count"], 1)
    def test_search_by_city_name(self):
        response = self.client.get(self.url, {"search": "kyiv"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
    def test_seatmap_has_layout_and_price(self):
        response = self.client.get(f"{self.url}{self.flight.id}/seatmap/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 180)
        first = response.data[0]
        self.assertEqual((first["row"], first["seat"]), (1, "A"))
        self.assertEqual(first["class_type"], "BUSINESS")
        self.assertEqual(first["price"], "270.00")
        self.assertEqual(first["ticket_status"], Ticket.TicketStatus.AVAILABLE)
    def test_seatmap_unknown_flight_returns_404(self):
        response = self.client.get(f"{self.url}999999/seatmap/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class BookingContractTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.user)
        self.flight = create_test_flight()
        self.ticket_ids = list(self.flight.tickets.values_list("id", flat=True)[:2])
        self.booking = create_booking(self.user, self.ticket_ids)

    def test_booking_detail_has_tickets_and_expiry(self):
        response = self.client.get(f"/api/flights/bookings/{self.booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["tickets"]), 2)
        ticket = response.data["tickets"][0]
        self.assertEqual(ticket["departure_iata"], "TDA")
        self.assertEqual(ticket["flight_id"], self.flight.id)
        self.assertIn("row", ticket)
        self.assertIsNone(response.data["payment"])
        self.assertIsNotNone(response.data["expires_at"])
    def test_cancelled_booking_has_no_expiry(self):
        cancel_booking(self.user, self.booking.id)
        response = self.client.get(f"/api/flights/bookings/{self.booking.id}/")
        self.assertIsNone(response.data["expires_at"])
    def test_booking_shows_payment_status(self):
        Payment.objects.create(
            booking=self.booking, stripe_session_id="cs_test_1", amount=self.booking.total_price
        )
        response = self.client.get(f"/api/flights/bookings/{self.booking.id}/")
        self.assertEqual(response.data["payment"]["status"], Payment.PaymentStatus.PENDING)
    def test_filter_bookings_by_status(self):
        response = self.client.get("/api/flights/bookings/", {"status__iexact": "cancelled"})
        self.assertEqual(response.data["count"], 0)
        response = self.client.get("/api/flights/bookings/", {"status__iexact": "pending"})
        self.assertEqual(response.data["count"], 1)

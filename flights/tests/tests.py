from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from flights.models import Ticket, Booking
from django.utils.timezone import now
from datetime import timedelta
from rest_framework import status
from flights.services.flight_service import create_booking
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
    @patch('flights.tasks.cancel_unpaid_booking.apply_async')
    def test_booking_creates_cancellation_task(self, mock_task):
        create_booking(self.user, self.ticket_ids)
        mock_task.assert_called_once_with(
            args=[Booking.objects.first().id], 
            countdown=1800
        )


    
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
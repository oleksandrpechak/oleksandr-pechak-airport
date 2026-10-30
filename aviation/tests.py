from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from aviation.models import AirplaneSeat, Airline, Airport
from locations.models import Country, City
from rest_framework import status

User = get_user_model()

class AirplaneViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email= "testa@ta.com", password="testpass123")
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.client.force_authenticate(user=self.admin)
        self.valid_payload = {
            "brand": "Boeing",
            "model": "737",
            "rows": 30,
            "seats_per_row": 6,
            "business_rows_percent": 20
        }
        self.url = "/api/aviation/airplanes/"

    def test_admin_can_create_airplane(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AirplaneSeat.objects.count(), 30 * 6)

    def test_unauthenticated_user_gets_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_business_rows_percent_too_low(self):
        payload = self.valid_payload.copy()
        payload["business_rows_percent"] = 0
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_invalid_business_rows_percent_too_high(self):
        payload = self.valid_payload.copy()
        payload["business_rows_percent"] = 51
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_create_airplane_returns_id(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)


class AirlineAirportViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email= "testa@ta.com", password="testpass123")
        country = Country.objects.create(country="Ukraine", code="UA")
        self.city = City.objects.create(city="Lviv", country=country)
        self.airline = Airline.objects.create(name="Test airline", founded_year=2002)
        self.airport = Airport.objects.create(name="Lviv Danylo Halytskyi", iata_code="LWO", city=self.city)

    def test_anyone_can_list_airlines(self):
        response = self.client.get("/api/aviation/airlines/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["founded_year"], 2002)
    def test_admin_can_create_airline_with_founded_year(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/aviation/airlines/", {"name": "New air", "founded_year": 1999}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Airline.objects.get(name="New air").founded_year, 1999)
    def test_invalid_founded_year_gets_400(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/aviation/airlines/", {"name": "New air", "founded_year": 3000}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_anonymous_cannot_create_airline(self):
        response = self.client.post("/api/aviation/airlines/", {"name": "New air"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_anyone_can_list_airports_with_city(self):
        response = self.client.get("/api/aviation/airports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        airport = response.data["results"][0]
        self.assertEqual(airport["city_name"], "Lviv")
        self.assertEqual(airport["country_code"], "UA")
    def test_airport_search_by_city(self):
        response = self.client.get("/api/aviation/airports/", {"search": "lviv"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

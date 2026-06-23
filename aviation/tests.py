from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from aviation.models import AirplaneSeat
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
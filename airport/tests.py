from rest_framework.test import APITestCase
from rest_framework import status
from locations.models import Country


class ApiSettingsTest(APITestCase):
    def test_cors_allows_frontend_origin(self):
        response = self.client.options(
            "/api/locations/countries/",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        )
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173"
        )
    def test_cors_rejects_unknown_origin(self):
        response = self.client.get(
            "/api/locations/countries/", HTTP_ORIGIN="https://evil.example"
        )
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)
    def test_page_size_is_capped(self):
        Country.objects.bulk_create(
            [Country(country=f"Country {i}", code=chr(65 + i // 26) + chr(65 + i % 26)) for i in range(120)]
        )
        response = self.client.get("/api/locations/countries/", {"limit": 1000})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 100)

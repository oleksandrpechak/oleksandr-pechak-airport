from rest_framework.test import APITestCase
from rest_framework import status
from locations.models import Country, City


class CityViewSetTest(APITestCase):
    def setUp(self):
        country = Country.objects.create(country="Ukraine", code="UA")
        City.objects.create(city="Lviv", country=country)

    def test_city_search_by_country_name(self):
        response = self.client.get("/api/locations/cities/", {"search": "ukraine"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

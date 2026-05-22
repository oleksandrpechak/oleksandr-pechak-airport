from rest_framework import serializers
from .models import City, Country


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "country", "code"]

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ["id", "city", "country"]
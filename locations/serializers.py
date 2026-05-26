from rest_framework import serializers
from .models import City, Country
from rest_framework.validators import UniqueValidator
from django.core.validators import RegexValidator


class CountrySerializer(serializers.ModelSerializer):
    # check if code contain exactly 2 uppercase letters (ISO alpha-2 code)
    code = serializers.CharField(
        max_length = 2,
        validators = [
            RegexValidator(
                regex=r'^[A-Z]{2}$',
                message="Country code must be exactly 2 uppercase letters (e.g., UA, UK)"
            ),
            UniqueValidator(queryset=Country.objects.all())
        ]
    )
    country = serializers.CharField(
        max_length=100,
        validators=[UniqueValidator(queryset=Country.objects.all(), message="This country is already registered")]
    )

    class Meta:
        model = Country
        fields = ['id', 'country', 'code']



class CitySerializer(serializers.ModelSerializer):
    city = serializers.CharField(
        max_length=150,
        validators = [UniqueValidator(queryset=City.objects.all(), message="This city is already registered.")]
    )
    class Meta:
        model = City
        fields = ["id", "city", "country"]
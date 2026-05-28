import django_filters
from .models import Country


class CountryFilter(django_filters.FilterSet):
    class Meta:
        model = Country
        fields = {
            'code' : ['exact']
        }


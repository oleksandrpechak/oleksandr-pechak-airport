from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Country, City
from .serializers import CountrySerializer, CitySerializer


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'country': ['exact', 'istartswith'],
        'code': ['exact', 'icontains']
    }


class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer


    def get_queryset(self):
        queryset = self.queryset.all()

        city = self.request.query_params.get("city")
        country = self.request.query_params.get("country")
        if city:
            queryset = queryset.filter(city__icontains=city)
        if country:
            queryset = queryset.filter(country__id=country)
        return queryset


from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Country, City
from .serializers import CountrySerializer, CitySerializer


@api_view(["GET", "POST"])
def country_list(request, format=None):
    """
    List all countries, or create a new country.
    """
    if request.method == "GET":
        countries = Country.objects.all()
        serializer = CountrySerializer(countries, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        serializer = CountrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["GET", "PUT", "DELETE"])
def country_detail(request, pk, format=None):
    """
    Retrieve, update or delete a code country.
    """
    try:
        country = Country.objects.get(pk=pk)
    except Country.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CountrySerializer(country)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = CountrySerializer(country, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        country.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def city_list(request, format=None):
    """
    List all cities, or create a new city.
    """
    if request.method == "GET":
        cities = City.objects.all()
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        serializer = CitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(["GET", "PUT", "DELETE"])
def city_detail(request, pk, format=None):
    """
    Retrieve, update or delete a city.
    """
    try:
        city = City.objects.get(pk=pk)
    except City.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = CitySerializer(city)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = CitySerializer(city, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        city.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



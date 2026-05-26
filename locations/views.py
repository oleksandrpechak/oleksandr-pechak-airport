from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Country, City
from .serializers import CountrySerializer, CitySerializer


@api_view(["GET", "POST"])
def country_list(request, format=None):
    """
    List all countries, or create a new country.
    """
    if request.method == "GET":
        countries = Country.objects.all()
        country = request.query_params.get("country")
        code = request.query_params.get("code")

        if country:
            countries = countries.filter(
                country__icontains=country
                )
            
        if code:
            countries = countries.filter(
                code__iexact=code
            )        
        paginator = PageNumberPagination()
        paginated_countries = paginator.paginate_queryset(
            countries,
            request
        )
        serializer = CountrySerializer(
            paginated_countries,
            many=True
        )
        return paginator.get_paginated_response(
            serializer.data
        )
    
    elif request.method == "POST":
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admin can create countries"},
                status=status.HTTP_403_FORBIDDEN
            )
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
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admin can edit countries"},
                status=status.HTTP_403_FORBIDDEN
            )
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

        city = request.query_params.get("city")
        country = request.query_params.get("country")

        if city:
            cities = cities.filter(
                city__icontains=city
                )
        if country:
            cities = cities.filter(
                country__country__icontains=country
            )
        
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 5))

        start = (page - 1) * page_size
        end = start + page_size

        paginated_cities = cities[start:end]

        serializer = CitySerializer(paginated_cities, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admin can create countries"},
                status=status.HTTP_403_FORBIDDEN
            )        
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
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admin can create countries"},
                status=status.HTTP_403_FORBIDDEN
            )        
        serializer = CitySerializer(city, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        city.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



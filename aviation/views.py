from .models import Airplane, Airline, Airport, Fleet
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer, FleetSerializer
from rest_framework import mixins
from rest_framework import generics


class AirplaneList(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    generics.GenericAPIView
):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    
class AirplaneDetail(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
    
class AirlineList(generics.ListCreateAPIView):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer


class AirlineDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer 
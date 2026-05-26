from .models import Flight, Ticket
from .serializers import FlightSerializer, TicketSerializer
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics


class FlightList(APIView):
    """
    List all flights, or create a new flight.
    """
    def get(self, request, format=None):
        flights = Flight.objects.all()
        serializer = FlightSerializer(flights, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        serializer = FlightSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlightDetail(APIView):
    """
    Retrieve, update or delete a flight instance.
    """
    def get_object(self, pk):
        try:
            return Flight.objects.get(pk=pk)
        except Flight.DoesNotExist:
            raise Http404
    
    def get(self, request, pk, format=None):
        flight = self.get_object(pk)
        serializer = FlightSerializer(flight)
        return Response(serializer.data)
    
    def put(self, request, pk, format=None):
        flight = self.get_object(pk)
        serializer = FlightSerializer(flight, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk, format=None):
        flight = self.get_object(pk)
        flight.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TicketList(generics.ListCreateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer


class TicketDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer


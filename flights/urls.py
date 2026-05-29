from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlightViewSet, TicketViewSet, BookingViewSet

router = DefaultRouter()

router.register(r'flights', FlightViewSet, basename='flight')
router.register(r'tickets', TicketViewSet,basename='ticket')
router.register(r'bookings', BookingViewSet,basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AirlineViewSet, AirplaneViewSet, AirportViewSet, AirplaneSeatViewSet, FleetItemViewSet

router = DefaultRouter()

router.register(r'airplanes', AirplaneViewSet,basename='airplane')
router.register(r'airlines', AirlineViewSet,basename='airline')
router.register(r'airports', AirportViewSet,basename='airport')
router.register(r'airplaneseats', AirplaneSeatViewSet,basename='airplaneseat')
router.register(r'fleetitems', FleetItemViewSet, basename='fleetsize' )

urlpatterns = [
    path('', include(router.urls)),
]

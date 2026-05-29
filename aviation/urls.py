from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AirlineViewSet, AirplaneViewSet, AirportViewSet, FleetViewSet

router = DefaultRouter()

router.register(r'airplanes', AirplaneViewSet,basename='airplane')
router.register(r'airlines', AirlineViewSet,basename='airline')
router.register(r'fleets', FleetViewSet,basename='fleet')
router.register(r'airports', AirportViewSet,basename='airport')

urlpatterns = [
    path('', include(router.urls)),
]

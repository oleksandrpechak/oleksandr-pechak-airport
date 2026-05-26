from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from aviation import views


urlpatterns = [
    path("airplanes/", views.AirplaneList.as_view()),
    path("airplanes<int:pk>/", views.AirplaneDetail.as_view()),
    \
    path("airlines/", views.AirlineList.as_view()),
    path("airliens<int:pk>/", views.AirlineDetail.as_view()),

    path("fleets/", views.FleetList.as_view()),
    path("fleets<int:pk>/", views.FleetDetail.as_view()),
    
    path("airports/", views.AirportList.as_view()),
    path("airports<int:pk>/", views.AirportDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
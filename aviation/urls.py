from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from aviation import views


urlpatterns = [
    path("airplanes/", views.AirplaneList.as_view()),
    path("airplanes<int:pk>/", views.AirplaneDetail.as_view()),
    \
    path("airlines/", views.AirlineList.as_view()),
    path("airliens<int:pk>/", views.AirlineDetail.as_view()),

    # path("airplanes/", views.List.as_view()),
    # path("airplanes<int:pk>/", views.AirlineDetail.as_view()),
    
    # path("airplanes/", views.AirplaneList.as_view()),
    # path("airplanes<int:pk>/", views.AirlineDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
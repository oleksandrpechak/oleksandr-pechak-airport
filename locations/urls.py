from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from locations import views


urlpatterns = [
    path("countries/", views.country_list),
    path("countries/<int:pk>/", views.country_detail),
    
    path("cities/", views.city_list),
    path("cities/<int:pk>/", views.city_detail),
]

urlpatterns = format_suffix_patterns(urlpatterns)
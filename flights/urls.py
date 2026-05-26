from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from flights import views


urlpatterns = [
    path("flights/", views.FlightList.as_view()),
    path("flights/<int:pk>/", views.FlightDetail.as_view()),
    path("tickets/", views.TicketList.as_view()),
    path("flights/<int:pk>/", views.TicketDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
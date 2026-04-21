from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ticketing.views import (
    TicketTypeViewSet, 
    BookingViewSet, 
    MyTicketViewSet,
    AdminTicketViewSet
)

router = DefaultRouter()
router.register(r'types', TicketTypeViewSet, basename='ticket-types')
router.register(r'booking', BookingViewSet, basename='booking')
router.register(r'my-tickets', MyTicketViewSet, basename='my-tickets')
router.register(r'admin/bookings', AdminTicketViewSet, basename='admin-bookings')

urlpatterns = [
    path('', include(router.urls)),
]

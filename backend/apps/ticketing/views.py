from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.metro.models import Station
from apps.ticketing.models import Ticket, TicketType
from apps.ticketing.serializers import (
    BookingCalculateRequestSerializer,
    BookingCreateRequestSerializer,
    StationSummarySerializer,
    TicketSerializer,
    TicketTypeSerializer,
    UserCategorySerializer,
)
from apps.ticketing.services.booking_service import BookingService
from apps.ticketing.services.email_service import TicketEmailService
from apps.users.models import UserCategory


class TicketTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """View available ticket types and user categories."""

    queryset = TicketType.objects.filter(is_active=True).order_by("id")
    serializer_class = TicketTypeSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        categories = UserCategory.objects.all().order_by("id")
        serializer = UserCategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="stations")
    def stations(self, request):
        stations = Station.objects.filter(is_active=True).order_by("sequence_order", "id")
        serializer = StationSummarySerializer(stations, many=True)
        return Response(serializer.data)


class BookingViewSet(viewsets.GenericViewSet):
    """Endpoints for calculation and ticket booking."""

    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"], url_path="calculate")
    def calculate(self, request):
        """Pre-calculate price based on user selection."""
        serializer = BookingCalculateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket_type = get_object_or_404(TicketType, id=serializer.validated_data["ticket_type_id"])
        from_st = None
        to_st = None

        if serializer.validated_data.get("from_station_id"):
            from_st = get_object_or_404(Station, id=serializer.validated_data["from_station_id"])
        if serializer.validated_data.get("to_station_id"):
            to_st = get_object_or_404(Station, id=serializer.validated_data["to_station_id"])

        if ticket_type.type == "single":
            if not from_st or not to_st:
                return Response(
                    {"detail": "Vui lòng chọn ga đi và ga đến cho vé lượt."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if from_st.id == to_st.id:
                return Response(
                    {"detail": "Ga đi và ga đến không được trùng nhau."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        date_of_birth = request.user.date_of_birth if getattr(request.user, "is_authenticated", False) else None
        price_data = BookingService.calculate_price(
            ticket_type,
            from_st,
            to_st,
            date_of_birth=date_of_birth,
        )
        passenger_group_label = "HSSV" if price_data["passenger_group"] == "hssv" else "Normal"

        return Response(
            {
                "ticket_type": ticket_type.name,
                "passenger_group": passenger_group_label,
                "age": price_data["age"],
                "base_price": price_data["base_price"],
                "discount_rate": price_data["discount_rate"],
                "total_price": price_data["total"],
            }
        )

    @action(detail=False, methods=["post"], url_path="book", permission_classes=[permissions.IsAuthenticated])
    def book(self, request):
        """Create a booking and send email."""
        serializer = BookingCreateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket_type = get_object_or_404(TicketType, id=serializer.validated_data["ticket_type_id"])
        from_st = None
        to_st = None
        valid_from = serializer.validated_data.get("valid_from")

        if serializer.validated_data.get("from_station_id"):
            from_st = get_object_or_404(Station, id=serializer.validated_data["from_station_id"])
        if serializer.validated_data.get("to_station_id"):
            to_st = get_object_or_404(Station, id=serializer.validated_data["to_station_id"])

        if ticket_type.type == "single":
            if not from_st or not to_st:
                return Response(
                    {"error": "Vui lòng chọn ga đi và ga đến cho vé lượt."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if from_st.id == to_st.id:
                return Response(
                    {"error": "Ga đi và ga đến không được trùng nhau."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            ticket = BookingService.create_ticket(
                user=request.user,
                ticket_type=ticket_type,
                from_st=from_st,
                to_st=to_st,
                valid_from=valid_from,
            )

            try:
                TicketEmailService.send_ticket_email(ticket)
            except Exception:
                pass

            qr_base64 = BookingService.generate_qr_base64(ticket)
            response_data = TicketSerializer(ticket).data
            response_data["qr_base64"] = qr_base64
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MyTicketViewSet(viewsets.ReadOnlyModelViewSet):
    """View user ticket history."""

    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["get"], url_path="qr")
    def get_qr(self, request, pk=None):
        """Regenerate QR if needed."""
        ticket = self.get_object()
        qr_base64 = BookingService.generate_qr_base64(ticket)
        return Response({"qr_base64": qr_base64})


class AdminTicketViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin view for all tickets."""

    queryset = Ticket.objects.all().order_by("-created_at")
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAdminUser]

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.utils import ProgrammingError
from django.core.cache import cache

from apps.metro.models import Station
from apps.payments.models import Payment
from apps.ticketing.models import Ticket, TicketScanHistory, TicketType
from apps.ticketing.serializers import (
    AdminTicketScanSerializer,
    BookingCalculateRequestSerializer,
    BookingCreateRequestSerializer,
    StationSummarySerializer,
    TicketScanHistorySerializer,
    TicketSerializer,
    TicketTypeSerializer,
    UserCategorySerializer,
)
from apps.ticketing.services.booking_service import BookingService
from apps.ticketing.services.email_service import TicketEmailService
from apps.ticketing.tasks import (
    send_ticket_email_task,
    send_scan_success_email_task,
    send_ticket_exhausted_email_task,
)
from apps.users.models import UserCategory
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination, ProfileResultsSetPagination


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
        is_round_trip = serializer.validated_data.get("is_round_trip", False)

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
            is_round_trip=is_round_trip,
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
        is_round_trip = serializer.validated_data.get("is_round_trip", False)

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
                is_round_trip=is_round_trip,
            )

            try:
                send_ticket_email_task.delay(str(ticket.id))
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
    pagination_class = ProfileResultsSetPagination

    def get_queryset(self):
        BookingService.expire_outdated_tickets()
        return Ticket.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["get"], url_path="public-info", permission_classes=[permissions.AllowAny])
    def public_info(self, request, pk=None):
        """Show limited ticket info for the success page without login."""
        ticket = get_object_or_404(Ticket, id=pk)
        return Response({
            "id": ticket.id,
            "ticket_type_name": ticket.ticket_type.name,
            "from_station_details": StationSummarySerializer(ticket.from_station).data if ticket.from_station else None,
            "to_station_details": StationSummarySerializer(ticket.to_station).data if ticket.to_station else None,
            "status": ticket.status,
            "valid_from": ticket.valid_from,
            "valid_until": ticket.valid_until,
            "price_paid": ticket.price_paid,
            "created_at": ticket.created_at,
        })

    @action(detail=True, methods=["get"], url_path="qr")
    def get_qr(self, request, pk=None):
        """Regenerate QR if needed."""
        ticket = self.get_object()
        qr_base64 = BookingService.generate_qr_base64(ticket)
        return Response({"qr_base64": qr_base64})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_ticket(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status != "pending":
            return Response(
                {"detail": "Chi co the huy ve dang pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = "cancelled"
        ticket.save(update_fields=["status", "updated_at"])
        Payment.objects.filter(ticket=ticket, status="pending").update(status="failed")
        return Response({"detail": "Da huy ve thanh cong.", "ticket_id": str(ticket.id)})


class AdminTicketViewSet(viewsets.ModelViewSet):
    """Admin view for all tickets."""

    queryset = Ticket.objects.all().order_by("-created_at")
    serializer_class = TicketSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        BookingService.expire_outdated_tickets()
        return Ticket.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        page = request.query_params.get('page', 1)
        cache_key = f"admin_tickets_list:page_{page}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        # Cache for 5 minutes
        cache.set(cache_key, response.data, timeout=300)
        return response

    @action(detail=False, methods=["post"], url_path="scan")
    def scan_ticket(self, request):
        # Invalidate ticket list cache
        # We delete up to 50 pages to be safe, or we could use a versioning system.
        # For simplicity, we'll clear the primary cache keys.
        for i in range(1, 51):
            cache.delete(f"admin_tickets_list:page_{i}")

        serializer = AdminTicketScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = None
        ticket_id = serializer.validated_data.get("ticket_id")
        qr_data = serializer.validated_data.get("qr_data")

        if ticket_id:
            ticket = Ticket.objects.filter(id=ticket_id).select_related("ticket_type").first()
        elif qr_data:
            parsed_id = None
            raw_data = qr_data.strip()
            
            # 1. Try parsing as JSON
            try:
                import json
                payload = json.loads(raw_data)
                parsed_id = payload.get("ticket_id")
            except Exception:
                pass

            # 2. Try parsing raw_data (or stripped QR-) as UUID
            if not parsed_id:
                candidate = raw_data
                if candidate.upper().startswith("QR-"):
                    candidate = candidate[3:]
                
                try:
                    import uuid
                    # Try to parse. uuid.UUID handles hex strings with or without hyphens.
                    val = uuid.UUID(candidate)
                    parsed_id = str(val)
                except (ValueError, AttributeError):
                    parsed_id = None

            if parsed_id:
                ticket = Ticket.objects.filter(id=parsed_id).select_related("ticket_type").first()
            
            # 3. Final fallback: exact string match on qr_code field
            if not ticket:
                ticket = Ticket.objects.filter(qr_code=raw_data).select_related("ticket_type").first()
            if not ticket and raw_data.upper().startswith("QR-"):
                 ticket = Ticket.objects.filter(qr_code=raw_data.upper()).select_related("ticket_type").first()

        scanned_at = timezone.now()
        scanned_by = getattr(request, "user", None) if getattr(request, "user", None) and request.user.is_authenticated else None

        if not ticket:
            # Log failed scan attempt (no ticket found)
            try:
                TicketScanHistory.objects.create(
                    ticket_id=None,  # may fail depending on DB constraints; ignore if so
                    scanned_by=scanned_by,
                    scanned_at=scanned_at,
                    scan_date=scanned_at.date(),
                    status_before=None,
                    status_after=None,
                    usage_remaining_before=None,
                    usage_remaining_after=None,
                    success=False,
                    message="Khong tim thay ve tu du lieu QR.",
                )
            except Exception:
                pass
            return Response({"detail": "Khong tim thay ve tu du lieu QR."}, status=status.HTTP_404_NOT_FOUND)

        BookingService.expire_outdated_tickets()
        ticket.refresh_from_db()
        status_before = ticket.status
        usage_before = ticket.usage_remaining

        if ticket.status == "expired":
            try:
                TicketScanHistory.objects.create(
                    ticket=ticket,
                    scanned_by=scanned_by,
                    scanned_at=scanned_at,
                    scan_date=scanned_at.date(),
                    status_before=status_before,
                    status_after=ticket.status,
                    usage_remaining_before=usage_before,
                    usage_remaining_after=ticket.usage_remaining,
                    success=False,
                    message="Ve da het han.",
                )
            except Exception:
                pass
            return Response(
                {
                    "success": False,
                    "detail": "Ve da het han.",
                    "ticket_id": str(ticket.id),
                    "status": ticket.status,
                    "scanned_at": scanned_at.isoformat(),
                    "scan_date": scanned_at.date().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ticket.status in ["cancelled", "pending"]:
            try:
                TicketScanHistory.objects.create(
                    ticket=ticket,
                    scanned_by=scanned_by,
                    scanned_at=scanned_at,
                    scan_date=scanned_at.date(),
                    status_before=status_before,
                    status_after=ticket.status,
                    usage_remaining_before=usage_before,
                    usage_remaining_after=ticket.usage_remaining,
                    success=False,
                    message="Ve chua hop le de su dung.",
                )
            except Exception:
                pass
            return Response(
                {
                    "success": False,
                    "detail": "Ve chua hop le de su dung.",
                    "ticket_id": str(ticket.id),
                    "status": ticket.status,
                    "scanned_at": scanned_at.isoformat(),
                    "scan_date": scanned_at.date().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ticket.ticket_type.type == "single":
            remaining = int(ticket.usage_remaining or 0)
            if remaining <= 0:
                ticket.status = "expired"
                ticket.save(update_fields=["status", "updated_at"])
                try:
                    TicketScanHistory.objects.create(
                        ticket=ticket,
                        scanned_by=scanned_by,
                        scanned_at=scanned_at,
                        scan_date=scanned_at.date(),
                        status_before=status_before,
                        status_after=ticket.status,
                        usage_remaining_before=usage_before,
                        usage_remaining_after=ticket.usage_remaining,
                        success=False,
                        message="Ve luot da het luot su dung.",
                    )
                except Exception:
                    pass
                return Response(
                    {
                        "success": False,
                        "detail": "Ve luot da het luot su dung.",
                        "ticket_id": str(ticket.id),
                        "status": ticket.status,
                        "usage_remaining": ticket.usage_remaining,
                        "scanned_at": scanned_at.isoformat(),
                        "scan_date": scanned_at.date().isoformat(),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            remaining -= 1
            ticket.usage_remaining = remaining
            # Cap nhat xuong can thiet: 0 thi phai la expired
            if remaining <= 0:
                ticket.status = "expired"
            elif ticket.status == "active":
                ticket.status = "used"
                
            ticket.save(update_fields=["usage_remaining", "status", "updated_at"])
            
            try:
                send_scan_success_email_task.delay(str(ticket.id))
                if remaining <= 0:
                    send_ticket_exhausted_email_task.delay(str(ticket.id))
            except Exception:
                pass
                
            try:                
                TicketScanHistory.objects.create(
                    ticket=ticket,
                    scanned_by=scanned_by,
                    scanned_at=scanned_at,
                    scan_date=scanned_at.date(),
                    status_before=status_before,
                    status_after=ticket.status,
                    usage_remaining_before=usage_before,
                    usage_remaining_after=ticket.usage_remaining,
                    success=True,
                    message="Quet ve thanh cong.",
                )
            except Exception:
                pass
            return Response(
                {
                    "success": True,
                    "detail": "Quet ve thanh cong.",
                    "ticket_id": str(ticket.id),
                    "status": ticket.status,
                    "usage_remaining": ticket.usage_remaining,
                    "scanned_at": scanned_at.isoformat(),
                    "scan_date": scanned_at.date().isoformat(),
                }
            )

        if ticket.status == "active":
            ticket.status = "used"
            ticket.save(update_fields=["status", "updated_at"])

        try:
            send_scan_success_email_task.delay(str(ticket.id))
        except Exception:
            pass

        try:
            TicketScanHistory.objects.create(
                ticket=ticket,
                scanned_by=scanned_by,
                scanned_at=scanned_at,
                scan_date=scanned_at.date(),
                status_before=status_before,
                status_after=ticket.status,
                usage_remaining_before=usage_before,
                usage_remaining_after=ticket.usage_remaining,
                success=True,
                message="Quet ve thanh cong.",
            )
        except Exception:
            pass
        return Response(
            {
                "success": True,
                "detail": "Quet ve thanh cong.",
                "ticket_id": str(ticket.id),
                "status": ticket.status,
                "usage_remaining": ticket.usage_remaining,
                "scanned_at": scanned_at.isoformat(),
                "scan_date": scanned_at.date().isoformat(),
            }
        )

    @action(detail=False, methods=["get"], url_path="scan-histories")
    def scan_histories(self, request):
        """
        Admin: list scan histories.
        Optional query params:
        - ticket_id (uuid)
        - success (true/false)
        - limit (default 200)
        """
        try:
            qs = TicketScanHistory.objects.select_related("ticket", "scanned_by").order_by("-scanned_at")
        except ProgrammingError:
            return Response([])
        ticket_id = request.query_params.get("ticket_id")
        success = request.query_params.get("success")
        try:
            limit = int(request.query_params.get("limit", "200"))
        except ValueError:
            limit = 200
        limit = max(1, min(limit, 1000))

        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)
        if success in ["true", "false"]:
            qs = qs.filter(success=(success == "true"))

        try:
            items = qs[:limit]
            return Response(TicketScanHistorySerializer(items, many=True).data)
        except ProgrammingError:
            return Response([])
    @action(detail=True, methods=["get"], url_path="qr")
    def get_qr(self, request, pk=None):
        """Allow admins to get QR code for any ticket."""
        ticket = self.get_object()
        qr_base64 = BookingService.generate_qr_base64(ticket)
        return Response({"qr_base64": qr_base64})

    def destroy(self, request, *args, **kwargs):
        ticket = self.get_object()
        ticket.status = "cancelled"
        ticket.save(update_fields=["status", "updated_at"])
        Payment.objects.filter(ticket=ticket, status="pending").update(status="failed")
        return Response(status=status.HTTP_204_NO_CONTENT)

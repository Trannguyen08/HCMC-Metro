from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.metro.models import Station
from apps.payments.models import Payment
from apps.payments.serializers import (
    PayOSContinuePaymentSerializer,
    PayOSCreatePaymentSerializer,
    PayOSVerifySerializer,
)
from apps.payments.services.payos_service import PayOSService
from apps.ticketing.models import Ticket, TicketType
from apps.ticketing.services.booking_service import BookingService
from apps.ticketing.services.email_service import TicketEmailService


def _frontend_payment_return_url() -> str:
    origins = getattr(settings, "CORS_ALLOWED_ORIGINS", None) or []
    base = origins[0] if origins else "http://127.0.0.1:3000"
    return f"{base.rstrip('/')}/payment-return"


def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "127.0.0.1")


def _create_pending_payment_for_ticket(*, ticket: Ticket, user, return_url: str, cancel_url: str):
    order_code = PayOSService.generate_order_code()
    payment = Payment.objects.create(
        ticket=ticket,
        user=user,
        amount=ticket.price_paid,
        method="payos",
        status="pending",
        transaction_ref=str(order_code),
    )
    payment_url = PayOSService.create_payment_link(
        order_code=order_code,
        amount=payment.amount,
        description=f"Thanh toan ve {str(ticket.id)[:8]}",
        return_url=return_url,
        cancel_url=cancel_url,
    )
    return payment, payment_url


class PayOSCreatePaymentAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not all([settings.PAYOS_CLIENT_ID, settings.PAYOS_API_KEY, settings.PAYOS_CHECKSUM_KEY]):
            return Response(
                {"detail": "PayOS chua duoc cau hinh day du trong bien moi truong."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = PayOSCreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ticket_type = get_object_or_404(TicketType, id=data["ticket_type_id"])
        from_st = get_object_or_404(Station, id=data["from_station_id"]) if data.get("from_station_id") else None
        to_st = get_object_or_404(Station, id=data["to_station_id"]) if data.get("to_station_id") else None

        if ticket_type.type == "single":
            if not from_st or not to_st:
                return Response({"detail": "Vui long chon ga di va ga den cho ve luot."}, status=status.HTTP_400_BAD_REQUEST)
            if from_st.id == to_st.id:
                return Response({"detail": "Ga di va ga den khong duoc trung nhau."}, status=status.HTTP_400_BAD_REQUEST)

        valid_from = data.get("valid_from")
        is_round_trip = data.get("is_round_trip", False)
        return_url = request.build_absolute_uri("/api/payments/payos/return/")
        cancel_url = request.build_absolute_uri("/api/payments/payos/cancel/")

        try:
            with transaction.atomic():
                ticket = BookingService.create_ticket(
                    user=request.user,
                    ticket_type=ticket_type,
                    from_st=from_st,
                    to_st=to_st,
                    valid_from=valid_from,
                    initial_status="pending",
                    is_round_trip=is_round_trip,
                )
                payment, payment_url = _create_pending_payment_for_ticket(
                    ticket=ticket,
                    user=request.user,
                    return_url=return_url,
                    cancel_url=cancel_url,
                )
        except Exception as exc:
            return Response(
                {"detail": f"Khong tao duoc link PayOS: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "ticket_id": str(ticket.id),
                "payment_id": str(payment.id),
                "payment_url": payment_url,
                "status": payment.status,
            },
            status=status.HTTP_201_CREATED,
        )


class PayOSContinuePaymentAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PayOSContinuePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = (
            Ticket.objects.filter(id=serializer.validated_data["ticket_id"], user=request.user)
            .select_related("user", "ticket_type", "from_station", "to_station")
            .first()
        )
        if not ticket:
            return Response({"detail": "Khong tim thay ve."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.status == "active":
            return Response({"detail": "Ve da duoc thanh toan."}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.status == "cancelled":
            return Response({"detail": "Ve da bi huy, khong the thanh toan tiep."}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.status != "pending":
            return Response({"detail": "Chi ho tro thanh toan tiep cho ve dang pending."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment, payment_url = _create_pending_payment_for_ticket(
                ticket=ticket,
                user=request.user,
                return_url=request.build_absolute_uri("/api/payments/payos/return/"),
                cancel_url=request.build_absolute_uri("/api/payments/payos/cancel/"),
            )
        except Exception as exc:
            return Response(
                {"detail": f"Khong tao duoc link PayOS: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "ticket_id": str(ticket.id),
                "payment_id": str(payment.id),
                "payment_url": payment_url,
                "status": payment.status,
            },
            status=status.HTTP_201_CREATED,
        )


class PayOSVerifyReturnAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = dict(request.data)
        serializer = PayOSVerifySerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        order_code = payload.get("orderCode")
        if not order_code:
            return Response({"success": False, "detail": "Thieu orderCode tu PayOS."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Su dung select_for_update de tranh race condition dan den gui mail 2 lan
            payment = Payment.objects.select_for_update().select_related("ticket", "user").filter(transaction_ref=str(order_code)).first()
            if not payment:
                return Response({"success": False, "detail": "Khong tim thay giao dich tuong ung."}, status=status.HTTP_404_NOT_FOUND)

            if payment.status == "success":
                return Response(
                    {"success": True, "ticket_id": str(payment.ticket_id), "detail": "Giao dich da duoc xac nhan truoc do."},
                    status=status.HTTP_200_OK,
                )

            status_from_gateway = payload.get("status")
            if not status_from_gateway:
                try:
                    status_from_gateway = PayOSService.get_payment_status(order_code=order_code)
                except Exception:
                    status_from_gateway = None

            is_success = PayOSService.is_success_status(status_from_gateway)

            if is_success:
                payment.status = "success"
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])

                ticket = payment.ticket
                ticket.status = "active"
                ticket.save(update_fields=["status", "updated_at"])

                try:
                    TicketEmailService.send_ticket_email(ticket)
                except Exception:
                    pass

                return Response(
                    {"success": True, "ticket_id": str(ticket.id), "detail": "Thanh toan thanh cong."},
                    status=status.HTTP_200_OK,
                )

            payment.status = "failed"
            payment.save(update_fields=["status"])

        return Response(
            {
                "success": False,
                "ticket_id": str(payment.ticket_id),
                "detail": "Thanh toan that bai hoac bi huy. Ve duoc giu o trang thai pending de thanh toan lai.",
                "gateway_status": status_from_gateway,
            },
            status=status.HTTP_200_OK,
        )


class PayOSReturnRedirectAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query_string = request.META.get("QUERY_STRING", "")
        redirect_url = _frontend_payment_return_url()
        if query_string:
            redirect_url = f"{redirect_url}?{query_string}"
        return HttpResponseRedirect(redirect_url)


class PayOSCancelRedirectAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query_string = request.META.get("QUERY_STRING", "")
        redirect_url = _frontend_payment_return_url()
        if query_string:
            redirect_url = f"{redirect_url}?{query_string}&status=CANCELLED"
        else:
            redirect_url = f"{redirect_url}?status=CANCELLED"
        return HttpResponseRedirect(redirect_url)

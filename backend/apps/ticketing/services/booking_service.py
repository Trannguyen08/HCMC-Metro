import qrcode
import base64
import io
import json
import logging
import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.cache import cache
from geopy.distance import geodesic
from django.db import models
from django.db.models import Exists, OuterRef

from apps.metro.models import Station
from apps.ticketing.models import Ticket, TicketScanHistory, TicketType

logger = logging.getLogger(__name__)


class BookingService:
    STUDENT_MAX_AGE = 22
    STUDENT_DISCOUNT_RATE = Decimal("0.30")
    SINGLE_TICKET_VALID_DAYS = 2
    TICKET_TIER_RANK = {
        "single": 1,
        "day": 2,
        "3day": 3,
        "week": 3,
        "month": 4,
    }

    @classmethod
    def get_ticket_tier_rank(cls, ticket_type: TicketType | None) -> int:
        if not ticket_type:
            return 0
        if ticket_type.type in cls.TICKET_TIER_RANK:
            return cls.TICKET_TIER_RANK[ticket_type.type]
        return 10 + int(ticket_type.duration_days or 0)

    @classmethod
    def get_highest_active_ticket(cls, user) -> Ticket | None:
        if not user or not getattr(user, "is_authenticated", False):
            return None
        cls.expire_outdated_tickets()
        today = timezone.localdate()
        active_tickets = (
            Ticket.objects.select_related("ticket_type")
            .filter(
                user=user,
                status__in=["active", "used"],
                valid_until__gte=today,
            )
            .exclude(usage_remaining=0)
        )
        highest = None
        highest_key = (-1, date.min)
        for ticket in active_tickets:
            rank = cls.get_ticket_tier_rank(ticket.ticket_type)
            key = (rank, ticket.valid_until or date.min)
            if key > highest_key:
                highest_key = key
                highest = ticket
        return highest

    @classmethod
    def validate_ticket_upgrade(cls, user, new_ticket_type: TicketType) -> Ticket | None:
        """
        Validate that user is not downgrading from a currently active higher-tier ticket.
        Users may purchase same-tier or higher-tier tickets only.
        """
        highest = cls.get_highest_active_ticket(user)
        if not highest:
            return None
        current_rank = cls.get_ticket_tier_rank(highest.ticket_type)
        new_rank = cls.get_ticket_tier_rank(new_ticket_type)
        if new_rank < current_rank:
            valid_until_str = highest.valid_until.strftime("%d/%m/%Y") if highest.valid_until else ""
            raise ValueError(
                f"Bạn đang sở hữu {highest.ticket_type.name} còn hiệu lực"
                f"{f' (đến {valid_until_str})' if valid_until_str else ''}. "
                f"Hệ thống chỉ cho phép đặt cùng hạng hoặc nâng cấp hạng vé cao hơn, "
                f"không thể đặt vé hạng thấp hơn ({new_ticket_type.name})."
            )
        return highest

    @staticmethod
    def calculate_age(date_of_birth: date | None, on_date: date | None = None) -> int | None:
        if not date_of_birth:
            return None
        today = on_date or timezone.localdate()
        age = today.year - date_of_birth.year
        if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
            age -= 1
        return age

    @classmethod
    def get_passenger_group(cls, date_of_birth: date | None, on_date: date | None = None) -> tuple[str, Decimal, int | None]:
        age = cls.calculate_age(date_of_birth, on_date=on_date)
        if age is not None and age <= cls.STUDENT_MAX_AGE:
            return "hssv", cls.STUDENT_DISCOUNT_RATE, age
        return "normal", Decimal("0"), age

    @staticmethod
    def calculate_distance(s1: Station, s2: Station) -> float:
        """Calculate distance in KM between two stations."""
        if not s1.latitude or not s1.longitude or not s2.latitude or not s2.longitude:
            return 0.0

        # Check cache first
        cache_key = f"distance:{min(s1.id, s2.id)}:{max(s1.id, s2.id)}"
        cached = cache.get(cache_key)
        if cached is not None:
            return float(cached)

        coords_1 = (float(s1.latitude), float(s1.longitude))
        coords_2 = (float(s2.latitude), float(s2.longitude))
        dist = geodesic(coords_1, coords_2).kilometers

        cache.set(cache_key, dist, 86400)  # cache for 1 day
        return dist

    @staticmethod
    def calculate_price(
        ticket_type: TicketType,
        from_st=None,
        to_st=None,
        date_of_birth: date | None = None,
        on_date: date | None = None,
        is_round_trip: bool = False,
    ) -> dict:
        """
        Calculate ticket price based on type, distance, and age-based passenger group.
        Returns: { 'base_price': decimal, 'discount_rate': decimal, 'total': decimal, 'passenger_group': str, 'age': int|None }
        """
        base_price = Decimal(ticket_type.price)

        # Distance-based for single tickets
        if ticket_type.type == 'single' and from_st and to_st:
            dist = BookingService.calculate_distance(from_st, to_st)
            # Logic: 7,000 base + 1,000 per KM
            base_price = Decimal(7000) + Decimal(dist * 1000)
            base_price = base_price.quantize(Decimal('100'))  # Round to nearest 100
            if is_round_trip:
                base_price = (base_price * Decimal("2")).quantize(Decimal("100"))

        passenger_group, discount_rate, age = BookingService.get_passenger_group(date_of_birth, on_date=on_date)

        total = base_price * (Decimal(1) - discount_rate)
        total = total.quantize(Decimal('100'))

        return {
            'base_price': base_price,
            'discount_rate': discount_rate,
            'total': total,
            'passenger_group': passenger_group,
            'age': age,
        }

    @staticmethod
    def generate_qr_base64(ticket: Ticket) -> str:
        """Generate a Base64 encoded QR code for the ticket."""
        qr_data = str(ticket.id)

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    @classmethod
    def create_ticket(
        cls,
        user,
        ticket_type,
        from_st=None,
        to_st=None,
        valid_from=None,
        initial_status="active",
        is_round_trip=False,
    ):
        """Create a new ticket and generate its QR code."""
        cls.validate_ticket_upgrade(user, ticket_type)

        if not valid_from:
            valid_from = timezone.localdate()

        valid_until = valid_from + timedelta(days=ticket_type.duration_days)
        if ticket_type.type == 'single':
            valid_until = valid_from + timedelta(days=cls.SINGLE_TICKET_VALID_DAYS)

        price_data = cls.calculate_price(
            ticket_type,
            from_st,
            to_st,
            date_of_birth=getattr(user, "date_of_birth", None),
            on_date=valid_from,
            is_round_trip=is_round_trip,
        )

        usage_remaining = None
        if ticket_type.type == "single":
            usage_remaining = 2 if is_round_trip else 1

        new_id = uuid.uuid4()
        qr_data = str(new_id)

        ticket = Ticket.objects.create(
            id=new_id,
            user=user,
            ticket_type=ticket_type,
            qr_code=qr_data,
            status=initial_status,
            valid_from=valid_from,
            valid_until=valid_until,
            from_station=from_st,
            to_station=to_st,
            price_paid=price_data['total'],
            usage_remaining=usage_remaining,
        )

        return ticket

    @staticmethod
    def expire_outdated_tickets() -> int:
        from apps.payments.models import Payment

        now = timezone.now()
        today = timezone.localdate()
        cutoff_dt = now - timedelta(days=BookingService.SINGLE_TICKET_VALID_DAYS)

        # Auto-cancel unused single tickets older than 2 days (or past valid_until without any scans)
        unused_single_qs = Ticket.objects.filter(
            ticket_type__type="single",
            status__in=["active", "pending"],
        ).annotate(
            has_scans=Exists(TicketScanHistory.objects.filter(ticket=OuterRef("pk")))
        ).filter(
            has_scans=False,
        ).filter(
            models.Q(created_at__lte=cutoff_dt) | models.Q(valid_until__lt=today)
        )

        cancelled_ids = list(unused_single_qs.values_list("id", flat=True))
        if cancelled_ids:
            Ticket.objects.filter(id__in=cancelled_ids).update(status="cancelled", updated_at=now)
            Payment.objects.filter(ticket_id__in=cancelled_ids, status="pending").update(status="failed")

        # Cap nhat ve het han khi het thoi gian hoac het luot su dung (0)
        expired_count = Ticket.objects.filter(
            models.Q(valid_until__lt=today) | models.Q(usage_remaining=0),
            status__in=["active", "used", "pending"],
        ).update(status="expired", updated_at=now)

        return len(cancelled_ids) + expired_count

import qrcode
import base64
import io
import json
import logging
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.cache import cache
from geopy.distance import geodesic
from django.db import models

from apps.metro.models import Station
from apps.ticketing.models import Ticket, TicketType

logger = logging.getLogger(__name__)

class BookingService:
    STUDENT_MAX_AGE = 22
    STUDENT_DISCOUNT_RATE = Decimal("0.30")

    @staticmethod
    def calculate_age(date_of_birth: date | None, on_date: date | None = None) -> int | None:
        if not date_of_birth:
            return None
        today = on_date or timezone.now().date()
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
        
        cache.set(cache_key, dist, 86400) # cache for 1 day
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
            base_price = base_price.quantize(Decimal('100')) # Round to nearest 100
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
        if not valid_from:
            valid_from = timezone.now().date()
            
        valid_until = valid_from + timedelta(days=ticket_type.duration_days)
        if ticket_type.type == 'single':
            valid_until = valid_from # Single trip is same day
            
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

        # Generate QR data string to be stored
        # We define a temporary UUID if needed, but usually the one generated by Ticket.objects.create is used.
        # Since id is default=uuid.uuid4, we can pre-generate it or just update after creation.
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
    def expire_outdated_tickets():
        today = timezone.now().date()
        # Cap nhat ve het han khi het thoi gian hoac het luot su dung (0)
        Ticket.objects.filter(
            models.Q(valid_until__lt=today) | models.Q(usage_remaining=0),
            status__in=["active", "used", "pending"],
        ).update(status="expired")

from rest_framework import serializers

from apps.metro.models import Station
from apps.ticketing.models import Ticket, TicketType
from apps.ticketing.services.booking_service import BookingService
from apps.users.models import UserCategory


def fix_text(value: str | None) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value)

    text = value
    for _ in range(2):
        try:
            candidate = text.encode("latin1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if candidate == text:
            break
        text = candidate
    return text


class UserCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = UserCategory
        fields = ["id", "name", "slug", "discount_rate", "description"]

    def get_name(self, obj: UserCategory) -> str:
        return fix_text(obj.name)

    def get_description(self, obj: UserCategory) -> str:
        return fix_text(obj.description)


class TicketTypeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = TicketType
        fields = ["id", "type", "name", "duration_days", "price", "description"]

    def get_name(self, obj: TicketType) -> str:
        if obj.type == "single":
            return "Vé lượt"
        return fix_text(obj.name)

    def get_description(self, obj: TicketType) -> str:
        return fix_text(obj.description)


class StationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ["id", "name", "code", "latitude", "longitude"]


class TicketSerializer(serializers.ModelSerializer):
    ticket_type_name = serializers.SerializerMethodField()
    from_station_details = StationSummarySerializer(source="from_station", read_only=True)
    to_station_details = StationSummarySerializer(source="to_station", read_only=True)
    discount_applied = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_type",
            "ticket_type_name",
            "qr_code",
            "status",
            "valid_from",
            "valid_until",
            "from_station",
            "to_station",
            "from_station_details",
            "to_station_details",
            "price_paid",
            "usage_remaining",
            "discount_applied",
            "created_at",
        ]

    def get_discount_applied(self, obj: Ticket) -> str:
        _, discount_rate, _ = BookingService.get_passenger_group(
            getattr(obj.user, "date_of_birth", None),
            on_date=getattr(obj, "valid_from", None),
        )
        return str(discount_rate)

    def get_ticket_type_name(self, obj: Ticket) -> str:
        ticket_type = getattr(obj, "ticket_type", None)
        if not ticket_type:
            return ""
        if ticket_type.type == "single":
            return "Vé lượt"
        return fix_text(ticket_type.name)


class BookingCalculateRequestSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    from_station_id = serializers.IntegerField(required=False)
    to_station_id = serializers.IntegerField(required=False)
    is_round_trip = serializers.BooleanField(required=False, default=False)


class BookingCreateRequestSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    from_station_id = serializers.IntegerField(required=False)
    to_station_id = serializers.IntegerField(required=False)
    valid_from = serializers.DateField(required=False)
    is_round_trip = serializers.BooleanField(required=False, default=False)


class AdminTicketScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField(required=False, allow_blank=True)
    ticket_id = serializers.UUIDField(required=False)

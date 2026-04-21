import uuid

from django.db import models

from apps.metro.models import Station
from apps.users.models import User


class TicketType(models.Model):
    type = models.CharField(max_length=50)  # 'single', 'single_day', etc.
    name = models.CharField(max_length=100)
    duration_days = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_types"
        managed = False


class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    ticket_type = models.ForeignKey(TicketType, on_delete=models.PROTECT, db_column="ticket_type_id")
    qr_code = models.TextField(unique=True, null=True, blank=True)
    status = models.CharField(max_length=30, default="pending")
    valid_from = models.DateField()
    valid_until = models.DateField()
    from_station = models.ForeignKey(
        Station,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tickets_from",
        db_column="from_station_id",
    )
    to_station = models.ForeignKey(
        Station,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tickets_to",
        db_column="to_station_id",
    )
    price_paid = models.DecimalField(max_digits=12, decimal_places=2)
    usage_remaining = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"
        managed = False


class TicketScanHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="scan_histories",
        db_column="ticket_id",
    )
    scanned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ticket_scan_histories",
        db_column="scanned_by",
    )
    scanned_at = models.DateTimeField(auto_now_add=True)
    scan_date = models.DateField()
    status_before = models.CharField(max_length=30, null=True, blank=True)
    status_after = models.CharField(max_length=30, null=True, blank=True)
    usage_remaining_before = models.IntegerField(null=True, blank=True)
    usage_remaining_after = models.IntegerField(null=True, blank=True)
    success = models.BooleanField(default=False)
    message = models.TextField()

    class Meta:
        db_table = "ticket_scan_histories"
        managed = False

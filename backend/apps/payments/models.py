import uuid
from django.db import models
from apps.users.models import User
from apps.ticketing.models import Ticket

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, db_column="ticket_id")
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=30, default="pending")
    transaction_ref = models.CharField(max_length=255, unique=True, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        managed = False

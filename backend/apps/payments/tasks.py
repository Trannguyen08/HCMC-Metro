import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from apps.payments.models import Payment
from apps.payments.services.payos_service import PayOSService
from apps.ticketing.tasks import send_ticket_email_task

logger = logging.getLogger(__name__)

@shared_task(name="apps.payments.tasks.process_payment_status_update_task")
def process_payment_status_update_task(order_code, gateway_status=None):
    """
    Background task to process payment status updates from PayOS.
    Handles both redirects and webhooks idempotently.
    """
    with transaction.atomic():
        # Lock the payment record to avoid race conditions (e.g., webhook and redirect at the same time)
        payment = Payment.objects.select_for_update().filter(transaction_ref=str(order_code)).first()
        if not payment:
            logger.error(f"Payment with transaction_ref {order_code} not found")
            return f"Error: Payment {order_code} not found"

        # If already success, nothing to do
        if payment.status == "success":
            logger.info(f"Payment {order_code} already processed as success")
            return "Already processed"

        # If gateway_status is not passed, fetch it from PayOS API
        if not gateway_status:
            try:
                gateway_status = PayOSService.get_payment_status(order_code=order_code)
            except Exception as e:
                logger.error(f"Failed to fetch status for {order_code}: {str(e)}")
                return f"Error: Failed to fetch status - {str(e)}"

        is_success = PayOSService.is_success_status(gateway_status)

        if is_success:
            payment.status = "success"
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "paid_at"])

            ticket = payment.ticket
            ticket.status = "active"
            ticket.save(update_fields=["status", "updated_at"])

            # Trigger the email task safely - don't let email failure roll back payment success
            try:
                send_ticket_email_task.delay(str(ticket.id))
            except Exception as e:
                logger.error(f"Failed to trigger email task for ticket {ticket.id}: {str(e)}")
            
            logger.info(f"Payment {order_code} marked as success and ticket {ticket.id} activated")
            return "Success"
        else:
            # Only update to failed if it wasn't already marked otherwise (e.g., cancelled)
            if gateway_status in ["CANCELLED", "FAILED"]:
                payment.status = "failed"
                payment.save(update_fields=["status"])
                logger.info(f"Payment {order_code} marked as failed ({gateway_status})")
                return f"Failed: {gateway_status}"

    return f"Pending: {gateway_status}"

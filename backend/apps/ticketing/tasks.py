import logging
from celery import shared_task
from django.apps import apps
from apps.ticketing.services.email_service import TicketEmailService

logger = logging.getLogger(__name__)

@shared_task(name="apps.ticketing.tasks.send_ticket_email_task")
def send_ticket_email_task(ticket_id):
    """
    Background task to send ticket confirmation email.
    """
    Ticket = apps.get_model('ticketing', 'Ticket')
    
    try:
        ticket = Ticket.objects.select_related('user', 'ticket_type', 'from_station', 'to_station').get(id=ticket_id)
        TicketEmailService.send_ticket_email(ticket)
        logger.info(f"Ticket email task completed for ticket {ticket_id}")
        return True
    except Ticket.DoesNotExist:
        logger.error(f"Ticket {ticket_id} does not exist for email task")
        return False
    except Exception as e:
        logger.error(f"Failed to send ticket email for ticket {ticket_id}: {str(e)}")
        # Optionally retry here
        return False

@shared_task(name="apps.ticketing.tasks.send_scan_success_email_task")
def send_scan_success_email_task(ticket_id):
    """
    Background task to send ticket scan success email.
    """
    Ticket = apps.get_model('ticketing', 'Ticket')
    try:
        ticket = Ticket.objects.select_related('user', 'ticket_type').get(id=ticket_id)
        TicketEmailService.send_scan_success_email(ticket)
        logger.info(f"Scan success email task completed for ticket {ticket_id}")
        return True
    except Ticket.DoesNotExist:
        logger.error(f"Ticket {ticket_id} does not exist for email task")
        return False
    except Exception as e:
        logger.error(f"Failed to send scan success email for ticket {ticket_id}: {str(e)}")
        return False

@shared_task(name="apps.ticketing.tasks.send_ticket_exhausted_email_task")
def send_ticket_exhausted_email_task(ticket_id):
    """
    Background task to send ticket exhausted email.
    """
    Ticket = apps.get_model('ticketing', 'Ticket')
    try:
        ticket = Ticket.objects.select_related('user', 'ticket_type').get(id=ticket_id)
        TicketEmailService.send_ticket_exhausted_email(ticket)
        logger.info(f"Ticket exhausted email task completed for ticket {ticket_id}")
        return True
    except Ticket.DoesNotExist:
        logger.error(f"Ticket {ticket_id} does not exist for email task")
        return False
    except Exception as e:
        logger.error(f"Failed to send ticket exhausted email for ticket {ticket_id}: {str(e)}")
        return False


@shared_task(name="apps.ticketing.tasks.cancel_expired_single_tickets_task")
def cancel_expired_single_tickets_task():
    """
    Periodic task to cancel unused single-trip tickets older than 2 days
    and mark remaining outdated tickets as expired.
    """
    from apps.ticketing.services.booking_service import BookingService

    BookingService.expire_outdated_tickets()
    logger.info("Checked and updated expired/unused single-trip tickets.")
    return True

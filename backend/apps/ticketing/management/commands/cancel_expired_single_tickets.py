from django.core.management.base import BaseCommand

from apps.ticketing.services.booking_service import BookingService


class Command(BaseCommand):
    help = "Huy cac ve luot chua su dung qua 2 ngay va cap nhat trang thai ve het han."

    def handle(self, *args, **options):
        updated = BookingService.expire_outdated_tickets()
        self.stdout.write(
            self.style.SUCCESS(f"Da cap nhat/huy {updated} ve qua han hoac ve luot chua su dung sau 2 ngay.")
        )

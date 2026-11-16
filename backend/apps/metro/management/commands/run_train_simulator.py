import time
import signal
import sys
from django.core.management.base import BaseCommand
from apps.metro.services.tracking_service import TrackingService


class Command(BaseCommand):
    help = "Run the IoT Train Telemetry Simulator, publishing live train states to Redis Pub/Sub every N seconds."

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=float,
            default=3.0,
            help="Publish interval in seconds (default: 3.0)",
        )

    def handle(self, *args, **options):
        interval = max(1.0, float(options["interval"]))
        running = True

        def handle_signal(signum, frame):
            nonlocal running
            running = False

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        self.stdout.write(
            self.style.SUCCESS(f"Starting HCMC Metro Telemetry Simulator (interval={interval}s)...")
        )

        service = TrackingService()
        while running:
            try:
                trains = service.publish_telemetry_tick()
                self.stdout.write(f"[Telemetry] Published {len(trains)} trains to Redis Pub/Sub")
            except Exception as exc:
                self.stderr.write(f"[Telemetry] Error: {exc}")
            time.sleep(interval)

        self.stdout.write(self.style.WARNING("Telemetry Simulator stopped."))
        sys.exit(0)

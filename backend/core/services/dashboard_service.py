from apps.users.models import User
from apps.ticketing.models import Ticket
from apps.metro.models import MetroLine, Station

class DashboardService:
    def get_stats(self):
        return {
            "total_users": User.objects.count(),
            "total_tickets": Ticket.objects.count(),
            "total_lines": MetroLine.objects.count(),
            "total_stations": Station.objects.count(),
            "revenue_vnd": 25450000,
        }

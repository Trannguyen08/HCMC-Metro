from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.ticketing.models import Ticket, TicketType
from apps.metro.models import MetroLine, Station

class DashboardService:
    def get_stats(self):
        total_users = User.objects.count()
        total_tickets = Ticket.objects.exclude(status="cancelled").count()
        total_lines = MetroLine.objects.count()
        total_stations = Station.objects.count()
        
        # Real revenue calculation
        revenue_data = Ticket.objects.exclude(status="cancelled").aggregate(
            total_revenue=Sum("price_paid")
        )
        total_revenue = float(revenue_data["total_revenue"] or 0)

        # Daily revenue for last 30 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=29)
        
        daily_revenue_raw = (
            Ticket.objects.filter(
                created_at__date__range=[start_date, end_date]
            )
            .exclude(status="cancelled")
            .values("created_at__date")
            .annotate(revenue=Sum("price_paid"))
            .order_by("created_at__date")
        )
        
        # Format for charts
        daily_revenue_map = {item["created_at__date"]: float(item["revenue"]) for item in daily_revenue_raw}
        daily_revenue = []
        for i in range(30):
            d = start_date + timedelta(days=i)
            daily_revenue.append({
                "date": d.strftime("%d/%m"),
                "revenue": daily_revenue_map.get(d, 0)
            })

        # Ticket types distribution
        type_stats_raw = (
            Ticket.objects.exclude(status="cancelled")
            .values("ticket_type__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        ticket_type_stats = [
            {"name": item["ticket_type__name"], "value": item["count"]}
            for item in type_stats_raw
        ]

        # Recent bookings
        recent_bookings = Ticket.objects.select_related("user", "ticket_type").order_by("-created_at")[:10]
        recent_bookings_data = [
            {
                "id": str(t.id),
                "user_name": t.user.full_name,
                "ticket_type": t.ticket_type.name,
                "price": float(t.price_paid),
                "status": t.status,
                "created_at": t.created_at.isoformat(),
            }
            for t in recent_bookings
        ]

        # Transactions in last 24h
        day_ago = timezone.now() - timedelta(hours=24)
        transactions_24h = Ticket.objects.filter(created_at__gte=day_ago).exclude(status="cancelled").count()

        # Usage rate (tickets with at least one success scan / total active tickets)
        active_tickets = Ticket.objects.exclude(status="cancelled").count()
        if active_tickets > 0:
            used_tickets = Ticket.objects.filter(scan_histories__success=True).distinct().count()
            usage_rate = round((used_tickets / active_tickets) * 100, 1)
        else:
            usage_rate = 0

        # Weekly Reports (Last 7 Days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        # 1. Top Buyers (Most tickets purchased)
        top_buyers_raw = (
            Ticket.objects.filter(created_at__gte=seven_days_ago)
            .exclude(status="cancelled")
            .values("user__full_name", "user__email")
            .annotate(total_tickets=Count("id"), total_spent=Sum("price_paid"))
            .order_by("-total_tickets")[:5]
        )
        top_buyers = [
            {
                "name": item["user__full_name"],
                "email": item["user__email"],
                "count": item["total_tickets"],
                "spent": float(item["total_spent"] or 0)
            }
            for item in top_buyers_raw
        ]

        # 2. Top Travellers (Most successful scans)
        # Using TicketScanHistory to count successful uses per user
        from apps.ticketing.models import TicketScanHistory
        top_travellers_raw = (
            TicketScanHistory.objects.filter(scanned_at__gte=seven_days_ago, success=True)
            .values("ticket__user__full_name", "ticket__user__email")
            .annotate(total_scans=Count("id"))
            .order_by("-total_scans")[:5]
        )
        top_travellers = [
            {
                "name": item["ticket__user__full_name"],
                "email": item["ticket__user__email"],
                "count": item["total_scans"]
            }
            for item in top_travellers_raw
        ]

        return {
            "total_users": total_users,
            "total_tickets": total_tickets,
            "total_lines": total_lines,
            "total_stations": total_stations,
            "revenue_vnd": total_revenue,
            "daily_revenue": daily_revenue,
            "ticket_type_stats": ticket_type_stats,
            "recent_bookings": recent_bookings_data,
            "usage_rate": usage_rate,
            "transactions_24h": transactions_24h,
            "top_buyers": top_buyers,
            "top_travellers": top_travellers,
        }

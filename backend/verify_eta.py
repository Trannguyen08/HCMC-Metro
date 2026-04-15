import os
import django
import sys

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev') 
django.setup()

from apps.metro.services.tracking_service import TrackingService
from apps.metro.models import Station

def verify():
    service = TrackingService()
    # Let's pick Suối Tiên as target (id=14)
    target = Station.objects.get(id=14)
    
    print(f"VERIFICATION: ETA Calculation for Target: {target.name}")
    print("-" * 60)
    
    trains = service.get_live_trains()
    inbound_trains = [t for t in trains if t['direction'] == 'inbound']
    
    for t in inbound_trains:
        # Distance (Haversine)
        dist = service._calculate_haversine(
            float(t['latitude']), float(t['longitude']), 
            float(target.latitude), float(target.longitude)
        )
        
        # ETA
        eta_seconds = service._calculate_eta_to_station(t, target)
        
        status = t['status']
        current = t['current_station']['name']
        
        if eta_seconds is not None:
            print(f"Train {t['train_number']}:")
            print(f"  Current Pos: {current} ({status})")
            print(f"  Dist to Target: {dist:.2f} km")
            print(f"  Calculated ETA: {int(eta_seconds)}s ({round(eta_seconds/60, 1)} min)")
        else:
            print(f"Train {t['train_number']}: Already passed or at {target.name}")
        print("-" * 30)

if __name__ == "__main__":
    verify()

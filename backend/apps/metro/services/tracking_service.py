import math
from datetime import datetime, time, timedelta
from typing import List, Dict, Any, Optional
from django.utils import timezone
from ..models import Station, Train, TrainStationLog

class TrackingService:
    """
    Simulates real-time train positions using deterministic time-based calculations.
    Assumption: Constant speed between stations and fixed dwell times.
    """
    
    AVERAGE_SPEED_KPH = 45.0
    DWELL_TIME_SECONDS = 30
    TURNAROUND_TIME_SECONDS = 300
    START_TIME_DAILY = time(5, 0, 0)
    END_TIME_DAILY = time(23, 0, 0)
    TRAIN_INTERVAL_MINUTES = 5
    
    def __init__(self):
        # ... existing init ...
        # Cache stations to avoid repeat DB hits
        self.stations = list(Station.objects.filter(is_active=True).order_by('sequence_order'))
        self.total_stations = len(self.stations)
        
        # Pre-calculate distances between adjacent stations
        self.segments = []
        for i in range(self.total_stations - 1):
            s1 = self.stations[i]
            s2 = self.stations[i+1]
            dist = self._calculate_haversine(
                float(s1.latitude), float(s1.longitude),
                float(s2.latitude), float(s2.longitude)
            )
            # Duration in seconds = (distance in km / speed in km/h) * 3600
            travel_time = (dist / self.AVERAGE_SPEED_KPH) * 3600
            self.segments.append({
                'from': s1,
                'to': s2,
                'distance': dist,
                'travel_time': travel_time
            })
            
        # Total one-way trip duration
        self.total_travel_time = sum(seg['travel_time'] for seg in self.segments)
        self.total_dwell_time = (self.total_stations - 1) * self.DWELL_TIME_SECONDS
        self.one_way_duration = self.total_travel_time + self.total_dwell_time
        
    def get_live_trains(self) -> List[Dict[str, Any]]:
        """
        Returns a list of all active trains and their current simulated state.
        """
        now = timezone.localtime()
        # Today's baseline start
        baseline = timezone.make_aware(datetime.combine(now.date(), self.START_TIME_DAILY))
        endline = timezone.make_aware(datetime.combine(now.date(), self.END_TIME_DAILY))
        
        # If before service starts or after service ends, show all trains at terminal
        if now < baseline or now >= endline:
            return self._get_static_positions("idle")
            
        results = []
        # We simulate 3 trains for 'outbound' and 3 for 'inbound'
        directions = ['outbound', 'inbound']
        
        for direction in directions:
            for i in range(3):
                # Offset each train
                train_offset = i * self.TRAIN_INTERVAL_MINUTES
                offset = timedelta(minutes=train_offset)
                
                if direction == 'inbound':
                    # Offset inbound trains to start at the Suối Tiên terminal (Phase 3)
                    offset += timedelta(seconds=self.one_way_duration + self.TURNAROUND_TIME_SECONDS)
                
                train_state = self._calculate_train_position(now, baseline, offset, direction)
                if train_state:
                    train_number = f"MT-L1-{direction[:2].upper()}-{i+1}"
                    train_state['train_number'] = train_number
                    train_state['trip_run'] = f"{train_number}_{now.strftime('%Y-%m-%d')}_run{train_state['run_number']}"
                    results.append(train_state)
        
        # Sync to DB
        self.sync_trains_to_db(results)
                    
        return results

    def get_station_arrivals(self, target_station_id: int) -> List[Dict[str, Any]]:
        """
        Predicts when trains will arrive at a specific station.
        """
        live_trains = self.get_live_trains()
        target_station = next((s for s in self.stations if s.id == target_station_id), None)
        
        if not target_station:
            return []
            
        arrivals = []
        for train in live_trains:
            eta = self._calculate_eta_to_station(train, target_station)
            if eta is not None:
                arrivals.append({
                    'train_number': train['train_number'],
                    'direction': train['direction'],
                    'eta_seconds': int(eta),
                    'eta_minutes': round(eta / 60, 1),
                    'current_station': train['current_station']['name'] if train['current_station'] else "In transit"
                })
                
        # Sort by ETA
        return sorted(arrivals, key=lambda x: x['eta_seconds'])

    def _calculate_train_position(self, now: datetime, baseline: datetime, offset: timedelta, direction: str) -> Dict[str, Any]:
        """
        Determines where a train is in the cycle.
        A 'cycle' is: Trip -> Rest at Terminal -> Reverse Trip -> Rest at Terminal.
        """
        # Time since start of service
        elapsed_seconds = (now - (baseline + offset)).total_seconds()
        
        # Full Cycle logic: Trip A -> Rest -> Trip B -> Rest
        turnaround_time = self.TURNAROUND_TIME_SECONDS
        
        # Total cycle duration for ONE train
        cycle_duration = 2 * (self.one_way_duration + turnaround_time)
        
        # Time since start relative to start of cycle
        relative_time = elapsed_seconds % cycle_duration
        
        # State determination
        # Phase 1: Outbound Trip (Bến Thành -> Suối Tiên)
        if relative_time < self.one_way_duration:
            order = self.stations
            current_direction = 'outbound'
            progress = relative_time
            is_trip = True
        # Phase 2: Rest at Suối Tiên
        elif relative_time < self.one_way_duration + turnaround_time:
            order = self.stations
            current_direction = 'outbound'
            progress = self.one_way_duration # Just reached end
            is_trip = False
        # Phase 3: Inbound Trip (Suối Tiên -> Bến Thành)
        elif relative_time < 2 * self.one_way_duration + turnaround_time:
            order = list(reversed(self.stations))
            current_direction = 'inbound'
            progress = relative_time - (self.one_way_duration + turnaround_time)
            is_trip = True
        # Phase 4: Rest at Bến Thành
        else:
            order = list(reversed(self.stations))
            current_direction = 'inbound'
            progress = self.one_way_duration # Just reached end
            is_trip = False

        cycle_number = int(elapsed_seconds // cycle_duration)
        run_number = cycle_number * 2 + (1 if current_direction == 'inbound' else 0)

        # If not moving (in rest phase)
        if not is_trip:
            last_station = order[-1]
            return {
                'direction': current_direction,
                'status': 'stopped',
                'current_station': self._station_to_dict(last_station),
                'next_station': None,
                'progress_to_next': 0,
                'time_to_next_seconds': 0,
                'latitude': float(last_station.latitude),
                'longitude': float(last_station.longitude),
                'run_number': run_number
            }
            
        # Finding where the train is between stations
        accumulated_time = 0
        for i in range(len(order) - 1):
            s1 = order[i]
            s2 = order[i+1]
            
            # Distance and travel time between these two
            dist = self._calculate_haversine(
                float(s1.latitude), float(s1.longitude),
                float(s2.latitude), float(s2.longitude)
            )
            seg_travel_time = (dist / self.AVERAGE_SPEED_KPH) * 3600
            
            # Phase 1: At Station s1 (Dwell)
            if progress < accumulated_time + self.DWELL_TIME_SECONDS:
                return {
                    'direction': current_direction,
                    'status': 'stopped',
                    'current_station': self._station_to_dict(s1),
                    'next_station': self._station_to_dict(s2),
                    'progress_to_next': 0,
                    'time_to_next_seconds': int((accumulated_time + self.DWELL_TIME_SECONDS - progress) + seg_travel_time),
                    'latitude': float(s1.latitude),
                    'longitude': float(s1.longitude),
                    'run_number': run_number
                }
            accumulated_time += self.DWELL_TIME_SECONDS
            
            # Phase 2: Between s1 and s2
            if progress < accumulated_time + seg_travel_time:
                seg_progress = (progress - accumulated_time) / seg_travel_time
                lat = float(s1.latitude) + (float(s2.latitude) - float(s1.latitude)) * seg_progress
                lon = float(s1.longitude) + (float(s2.longitude) - float(s1.longitude)) * seg_progress
                return {
                    'direction': current_direction,
                    'status': 'moving',
                    'current_station': self._station_to_dict(s1),
                    'next_station': self._station_to_dict(s2),
                    'progress_to_next': seg_progress,
                    'time_to_next_seconds': int(accumulated_time + seg_travel_time - progress),
                    'latitude': lat,
                    'longitude': lon,
                    'run_number': run_number
                }
            accumulated_time += seg_travel_time
            
        # Fallback to last station
        return {
            'direction': current_direction,
            'status': 'stopped',
            'current_station': self._station_to_dict(order[-1]),
            'next_station': None,
            'progress_to_next': 0,
            'time_to_next_seconds': 0,
            'latitude': float(order[-1].latitude),
            'longitude': float(order[-1].longitude),
            'run_number': run_number
        }

    def sync_trains_to_db(self, live_trains: List[Dict[str, Any]]):
        """
        Updates the Train model in the DB to reflect the simulation.
        """
        for state in live_trains:
            try:
                train_num = state['train_number']
                # Create or update train
                # Assuming Train objects with matching numbers should be synced
                train, created = Train.objects.get_or_create(
                    train_number=train_num,
                    defaults={'status': 'active', 'is_active': True}
                )
                
                # Update fields
                train.direction = state['direction']
                train.status = 'active' if state['status'] == 'moving' else 'stopped'
                train.is_simulated = True
                
                # Update current station
                st_id = state['current_station']['id']
                train.current_station_id = st_id
                
                train.save()

                # Handle TrainStationLog
                if state['status'] == 'stopped':
                    # Train is at a station, record arrival
                    log, created_log = TrainStationLog.objects.get_or_create(
                        train=train,
                        station_id=st_id,
                        trip_run=state['trip_run'],
                        defaults={
                            'direction': train.direction,
                            'arrived_at': timezone.now()
                        }
                    )
                else:
                    # Train is moving, meaning it has departed the current_station
                    # Let's find the log for this station and trip_run and set departed_at if not set
                    log = TrainStationLog.objects.filter(
                        train=train,
                        station_id=st_id,
                        trip_run=state['trip_run'],
                        departed_at__isnull=True
                    ).first()
                    if log:
                        log.departed_at = timezone.now()
                        log.save()
            except Exception as e:
                print(f"Error syncing train {train_num}: {e}")

    def _calculate_eta_to_station(self, train_state: Dict[str, Any], target_station: Station) -> Optional[float]:
        """
        Calculates how many seconds until the train reaches the target station.
        """
        direction = train_state['direction']
        order = list(reversed(self.stations)) if direction == 'outbound' else self.stations
        
        # Current index in the order
        current_st_name = train_state['current_station']['name']
        try:
            current_idx = next(i for i, s in enumerate(order) if s.name == current_st_name)
            target_idx = next(i for i, s in enumerate(order) if s.id == target_station.id)
        except StopIteration:
            return None # Target not on this direction's path
            
        if target_idx <= current_idx:
            # Already passed or currently at (if already passed, we don't show it for arrival info)
            return None
            
        # Sum travel and dwell times from current position
        remaining_time = 0
        
        # 1. Remaining time in current segment if moving
        if train_state['status'] == 'moving':
            # We need to find the segment we are in
            s1 = order[current_idx]
            s2 = order[current_idx + 1]
            dist = self._calculate_haversine(float(s1.latitude), float(s1.longitude), float(s2.latitude), float(s2.longitude))
            seg_travel_time = (dist / self.AVERAGE_SPEED_KPH) * 3600
            remaining_in_seg = (1 - train_state['progress_to_next']) * seg_travel_time
            remaining_time += remaining_in_seg
            start_search_from = current_idx + 1
        else:
            # Train is stopped at current_idx. It needs to wait for dwell + start travel
            # But the simulation already accounted for dwell? 
            # Let's just calculate from the next segment start.
            start_search_from = current_idx
            
        # 2. Add all full segments until target
        for i in range(start_search_from, target_idx):
            s_from = order[i]
            s_to = order[i+1]
            dist = self._calculate_haversine(float(s_from.latitude), float(s_from.longitude), float(s_to.latitude), float(s_to.longitude))
            travel = (dist / self.AVERAGE_SPEED_KPH) * 3600
            remaining_time += travel + self.DWELL_TIME_SECONDS
            
        return remaining_time

    def _calculate_haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _station_to_dict(self, station: Station) -> Dict[str, Any]:
        return {
            'id': station.id,
            'name': station.name,
            'latitude': float(station.latitude),
            'longitude': float(station.longitude),
            'sequence_order': station.sequence_order
        }

    def _get_static_positions(self, status: str) -> List[Dict[str, Any]]:
        # Service hasn't started, all trains at departure terminal
        results = []
        for direction in ['outbound', 'inbound']:
            start_station = self.stations[-1] if direction == 'outbound' else self.stations[0]
            for i in range(3):
                results.append({
                    'train_number': f"MT-L1-{direction[:2].upper()}-{i+1}",
                    'direction': direction,
                    'status': status,
                    'current_station': self._station_to_dict(start_station),
                    'next_station': None,
                    'progress_to_next': 0,
                    'time_to_next_seconds': 0,
                    'latitude': float(start_station.latitude),
                    'longitude': float(start_station.longitude)
                })
        return results

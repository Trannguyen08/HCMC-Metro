import json
import logging
import math
import random
from datetime import datetime, time, timedelta
from typing import List, Dict, Any, Optional
from zoneinfo import ZoneInfo
from django.utils import timezone
from infrastructure.redis_client import get_redis
from ..models import Station, Train, TrainStationLog

logger = logging.getLogger(__name__)

HCMC_TZ = ZoneInfo("Asia/Ho_Chi_Minh")
LIVE_TRAINS_REDIS_KEY = "hcmc_metro:tracking:live_trains"
LIVE_TRAINS_CHANNEL = "hcmc_metro:tracking:updates"

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
        
    def get_live_trains(self, use_telemetry: bool = True) -> List[Dict[str, Any]]:
        """
        Returns active trains from the real-time Redis telemetry stream if available,
        falling back to deterministic time-based calculation when the simulator is offline.
        """
        if use_telemetry:
            r = get_redis()
            if r is not None:
                try:
                    raw = r.get(LIVE_TRAINS_REDIS_KEY)
                    if raw:
                        data = json.loads(raw)
                        if isinstance(data, list) and data:
                            return data
                except Exception as exc:
                    logger.warning("Failed to read telemetry from Redis: %s", exc)

        return self._compute_train_states(source="deterministic_fallback", sync_db=True)

    def publish_telemetry_tick(self) -> List[Dict[str, Any]]:
        """
        Called by the IoT Telemetry Simulator every few seconds:
        computes/updates train positions with realistic speed variance,
        persists to Redis state store, and broadcasts via Redis Pub/Sub.
        """
        results = self._compute_train_states(source="telemetry_stream", sync_db=True, add_jitter=True)
        r = get_redis()
        if r is not None:
            try:
                payload = json.dumps(results)
                r.setex(LIVE_TRAINS_REDIS_KEY, 15, payload)
                r.publish(LIVE_TRAINS_CHANNEL, payload)
            except Exception as exc:
                logger.warning("Failed to publish telemetry tick to Redis: %s", exc)
        return results

    def _compute_train_states(
        self,
        source: str = "deterministic_fallback",
        sync_db: bool = True,
        add_jitter: bool = False,
        at_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        now = timezone.localtime(at_time or timezone.now(), HCMC_TZ)
        baseline = datetime.combine(now.date(), self.START_TIME_DAILY, tzinfo=HCMC_TZ)
        endline = datetime.combine(now.date(), self.END_TIME_DAILY, tzinfo=HCMC_TZ)

        if now < baseline or now >= endline:
            static = self._get_static_positions("idle")
            for item in static:
                item["speed_kph"] = 0.0
                item["is_operating"] = False
                item["operating_hours"] = "05:00 - 23:00"
                item["source"] = source
                item["updated_at"] = now.isoformat()
            if sync_db:
                self.sync_trains_to_db(static)
            return static

        results = []
        directions = ['outbound', 'inbound']

        for direction in directions:
            for i in range(3):
                train_offset = i * self.TRAIN_INTERVAL_MINUTES
                offset = timedelta(minutes=train_offset)

                if direction == 'inbound':
                    offset += timedelta(seconds=self.one_way_duration + self.TURNAROUND_TIME_SECONDS)

                train_state = self._calculate_train_position(
                    now,
                    baseline,
                    endline,
                    offset,
                    direction,
                    is_final_slot=(i == 2),
                )
                if train_state:
                    train_number = f"MT-L1-{direction[:2].upper()}-{i+1}"
                    train_state['train_number'] = train_number
                    train_state['trip_run'] = f"{train_number}_{now.strftime('%Y-%m-%d')}_run{train_state['run_number']}"
                    if train_state['status'] == 'moving':
                        speed = self.AVERAGE_SPEED_KPH + (random.uniform(-2.5, 2.5) if add_jitter else 0.0)
                        train_state['speed_kph'] = round(speed, 1)
                    else:
                        train_state['speed_kph'] = 0.0
                    train_state['is_operating'] = True
                    train_state['operating_hours'] = "05:00 - 23:00"
                    train_state['source'] = source
                    train_state['updated_at'] = now.isoformat()
                    results.append(train_state)

        if sync_db:
            self.sync_trains_to_db(results)

        return results

    def get_station_arrivals(self, target_station_id: int) -> List[Dict[str, Any]]:
        """
        Predicts when trains will arrive at a specific station.
        Returns [] when the metro system is closed (23:00 - 05:00 ICT).
        """
        live_trains = self.get_live_trains()
        if not live_trains or all(t.get('status') == 'idle' or t.get('is_operating') is False for t in live_trains):
            return []

        target_station = next((s for s in self.stations if s.id == target_station_id), None)
        
        if not target_station:
            return []
            
        arrivals = []
        for train in live_trains:
            if train.get('status') == 'idle':
                continue
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

    def _calculate_train_position(
        self,
        now: datetime,
        baseline: datetime,
        endline: datetime,
        offset: timedelta,
        direction: str,
        is_final_slot: bool = False,
    ) -> Dict[str, Any]:
        """
        Determines where a train is in the cycle.
        Guarantees no trip extends past 23:00 and aligns the last train slot
        to finish its final journey right at 23:00:00 ICT.
        """
        first_start = baseline + offset
        elapsed_seconds = (now - first_start).total_seconds()
        turnaround_time = self.TURNAROUND_TIME_SECONDS
        cycle_duration = 2 * (self.one_way_duration + turnaround_time)

        # Before this train's first departure after 05:00
        if elapsed_seconds < 0:
            order = self.stations if direction == 'outbound' else list(reversed(self.stations))
            return {
                'direction': direction,
                'status': 'stopped',
                'current_station': self._station_to_dict(order[0]),
                'next_station': self._station_to_dict(order[1]) if len(order) > 1 else None,
                'progress_to_next': 0,
                'time_to_next_seconds': int(abs(elapsed_seconds)),
                'latitude': float(order[0].latitude),
                'longitude': float(order[0].longitude),
                'run_number': 0,
            }

        # Check wind-down window so the final trip ends cleanly by 23:00:00
        total_day_seconds = (endline - first_start).total_seconds()
        seconds_left_in_day = (endline - now).total_seconds()

        # Final scheduled trip finishes at exact endline (23:00:00) for the final slot train
        final_trip_start = endline - timedelta(seconds=self.one_way_duration)
        cutoff = final_trip_start if is_final_slot else endline
        if is_final_slot and now >= final_trip_start and now < endline:
            final_dir = direction
            order = self.stations if final_dir == 'outbound' else list(reversed(self.stations))
            progress = (now - final_trip_start).total_seconds()
            run_number = int(total_day_seconds // (self.one_way_duration + turnaround_time))
            return self._resolve_progress_on_order(order, final_dir, progress, run_number)

        cycle_number = int(elapsed_seconds // cycle_duration)
        cycle_start_time = first_start + timedelta(seconds=cycle_number * cycle_duration)
        relative_time = elapsed_seconds % cycle_duration

        # Phase 1: Outbound Trip (Bến Thành -> Suối Tiên)
        if relative_time < self.one_way_duration:
            trip_end_time = cycle_start_time + timedelta(seconds=self.one_way_duration)
            if trip_end_time > cutoff:
                # Do not start a trip that cannot complete before 23:00 / final trip slot
                return self._parked_at_station(self.stations[0], 'outbound', cycle_number * 2)
            order = self.stations
            current_direction = 'outbound'
            progress = relative_time
            is_trip = True
        # Phase 2: Rest at Suối Tiên
        elif relative_time < self.one_way_duration + turnaround_time:
            order = self.stations
            current_direction = 'outbound'
            progress = self.one_way_duration
            is_trip = False
        # Phase 3: Inbound Trip (Suối Tiên -> Bến Thành)
        elif relative_time < 2 * self.one_way_duration + turnaround_time:
            trip_start_offset = self.one_way_duration + turnaround_time
            trip_end_time = cycle_start_time + timedelta(seconds=trip_start_offset + self.one_way_duration)
            if trip_end_time > cutoff:
                return self._parked_at_station(self.stations[-1], 'inbound', cycle_number * 2 + 1)
            order = list(reversed(self.stations))
            current_direction = 'inbound'
            progress = relative_time - trip_start_offset
            is_trip = True
        # Phase 4: Rest at Bến Thành
        else:
            order = list(reversed(self.stations))
            current_direction = 'inbound'
            progress = self.one_way_duration
            is_trip = False

        run_number = cycle_number * 2 + (1 if current_direction == 'inbound' else 0)

        if not is_trip:
            # If remaining time in the day is less than a full trip (unless final slot picks up), stay parked
            if seconds_left_in_day < self.one_way_duration and not is_final_slot:
                return self._parked_at_station(order[-1], current_direction, run_number)
            return self._parked_at_station(order[-1], current_direction, run_number)

        return self._resolve_progress_on_order(order, current_direction, progress, run_number)

    def _parked_at_station(self, station: Station, direction: str, run_number: int) -> Dict[str, Any]:
        return {
            'direction': direction,
            'status': 'stopped',
            'current_station': self._station_to_dict(station),
            'next_station': None,
            'progress_to_next': 0,
            'time_to_next_seconds': 0,
            'latitude': float(station.latitude),
            'longitude': float(station.longitude),
            'run_number': run_number,
        }

    def _resolve_progress_on_order(self, order: List[Station], current_direction: str, progress: float, run_number: int) -> Dict[str, Any]:
            
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

                # Handle TrainStationLog only during active service hours
                if state['status'] == 'idle':
                    continue
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

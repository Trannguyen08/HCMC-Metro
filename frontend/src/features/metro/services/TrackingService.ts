import axios from 'axios';

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
}

export interface LiveTrain {
  train_number: string;
  direction: 'outbound' | 'inbound';
  status: 'moving' | 'stopped' | 'idle';
  current_station: Station;
  next_station: Station | null;
  progress_to_next: number;
  time_to_next_seconds: number;
  latitude: number;
  longitude: number;
}

export interface TrainArrival {
  train_number: string;
  direction: 'outbound' | 'inbound';
  eta_seconds: number;
  eta_minutes: number;
  current_station: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class TrackingService {
  static async getLiveTrains(): Promise<LiveTrain[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/metro/tracking/live/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live trains:', error);
      return [];
    }
  }

  static async getStationArrivals(stationId: number): Promise<TrainArrival[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/metro/tracking/eta/${stationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching station arrivals:', error);
      return [];
    }
  }

  static async getStations(): Promise<Station[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/metro/tracking/stations/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tracking stations:', error);
      return [];
    }
  }
}

export default TrackingService;

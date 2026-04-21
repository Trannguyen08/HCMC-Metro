'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, MapPin, Navigation, List } from 'lucide-react';

import TrackingService, { LiveTrain, Station, TrainArrival } from '../services/TrackingService';
import LiveMetroTracker from './LiveMetroTracker';
import LiveTrainTable from './LiveTrainTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StationSelect } from "./StationSelect";
import { METRO_STATIONS, type MetroStation } from "@/lib/mock-data";

export function RouteLookup() {
  const [trains, setTrains] = useState<LiveTrain[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null);
  const [arrivals, setArrivals] = useState<TrainArrival[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for live train data
  useEffect(() => {
    const loadData = async () => {
      const [stData, trainData] = await Promise.all([
        TrackingService.getStations(),
        TrackingService.getLiveTrains()
      ]);
      setStations(stData);
      setTrains(trainData);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(async () => {
      const trainData = await TrackingService.getLiveTrains();
      setTrains(trainData);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch arrivals when selectedStation changes
  useEffect(() => {
    if (selectedStation) {
      const fetchArrivals = async () => {
        const data = await TrackingService.getStationArrivals(selectedStation.id);
        // We only want the top 3 fastest
        setArrivals(data.slice(0, 3));
      };
      fetchArrivals();
      const interval = setInterval(fetchArrivals, 15000);
      return () => clearInterval(interval);
    } else {
      setArrivals([]);
    }
  }, [selectedStation]);

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h1 className="font-heading text-3xl font-black tracking-tight text-gray-900 uppercase">
              Bản điều khiển Vận hành Live
            </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-5">
          Theo dõi trực quan vị trí tàu, thời gian đến ga và trạng thái vận hành toàn tuyến Line 1.
        </p>
      </div>

      {/* 1. Visual Map Tracker */}
      <LiveMetroTracker />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
            {/* 2. Detailed Status Table */}
            <LiveTrainTable trains={trains} />
        </div>

        <div className="lg:col-span-4 space-y-6">
            {/* 3. Station Specific Lookup */}
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Tra cứu theo Ga
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                            Chọn ga tham khảo
                        </label>
                        <div className="text-gray-900">
                            <StationSelect
                                value={selectedStation}
                                onChange={setSelectedStation}
                                stations={stations}
                                placeholder="Chọn ga để xem thời gian đến..."
                            />
                        </div>
                    </div>

                    {selectedStation ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium opacity-80">3 tàu sắp đến sớm nhất:</span>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                            </div>
                            
                            {arrivals.length > 0 ? (
                                <div className="space-y-3">
                                    {arrivals.map((arr, i) => (
                                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between hover:bg-white/20 transition-colors border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-blue-600 shadow-lg">
                                                    <Navigation className={`w-4 h-4 ${arr.direction === 'inbound' ? 'rotate-180' : ''}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black">{arr.train_number}</p>
                                                    <p className="text-[10px] font-medium opacity-70 capitalize">
                                                        {arr.direction === 'outbound' ? "Lượt đi" : "Lượt về"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black">{Math.floor(arr.eta_minutes)} <span className="text-xs font-normal opacity-70">phút</span></p>
                                                <p className="text-[10px] font-medium opacity-60">Từ {arr.current_station}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5 italic text-sm opacity-60">
                                    Không có tàu nào trong phạm vi theo dõi sắp tới ga này.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm opacity-60 flex flex-col items-center gap-3">
                            <List className="w-8 h-8 opacity-40" />
                            Vui lòng chọn một ga phía trên để xem thời gian tàu dự kiến cập bến.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 italic text-[11px] text-gray-500 space-y-2">
                <p className="font-bold flex items-center gap-1 uppercase tracking-tighter">
                    <Clock className="w-3 h-3" />
                    Ghi chú vận hành:
                </p>
                <p>• Dữ liệu tàu được cập nhật dựa trên cảm biến vị trí (giả lập) và vận tốc thực tế trung bình 45km/h.</p>
                <p>• Thời gian dừng ga quy định là 30 giây mỗi trạm.</p>
            </div>
        </div>
      </div>
    </div>
  );
}

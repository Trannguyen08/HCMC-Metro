'use client';

import React, { useEffect, useState } from 'react';
import TrackingService, { LiveTrain, Station } from '../services/TrackingService';
import { Train, MapPin, Navigation, Clock } from 'lucide-react';

const LiveMetroTracker: React.FC = () => {
    const [trains, setTrains] = useState<LiveTrain[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            const [stData, trainData] = await Promise.all([
                TrackingService.getStations(),
                TrackingService.getLiveTrains()
            ]);
            setStations(stData);
            setTrains(trainData);
            setLoading(false);
        };

        loadInitialData();

        const unsubscribe = TrackingService.subscribeToLiveTrains(
            (data) => {
                setTrains(data);
                setLoading(false);
            }
        );

        // Fallback safety poll in case SSE drops
        const interval = setInterval(async () => {
            const data = await TrackingService.getLiveTrains();
            setTrains(data);
        }, 15000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    if (loading) return <div className="text-center p-4">Đang tải dữ liệu thực tế...</div>;

    const isStreamLive = trains.some((t) => t.source === 'telemetry_stream');
    const isClosedHours = trains.length > 0 && trains.every((t) => t.status === 'idle' || t.is_operating === false);

    return (
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-xl mb-8">
            {isClosedHours && (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Hệ thống Metro tạm ngừng vận hành (23:00 – 05:00)</p>
                            <p className="text-xs text-slate-300">Chuyến tàu cuối trong ngày đã kết thúc lúc 23:00. Tuyến hoạt động trở lại từ 05:00 sáng.</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center self-start sm:self-center rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200 border border-amber-300/30 whitespace-nowrap">
                        Ngoài giờ hoạt động
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Navigation className={`w-6 h-6 ${isClosedHours ? 'text-slate-400' : 'text-blue-600 animate-pulse'}`} />
                        Trạng thái Tàu Real-time
                        <span
                            className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isClosedHours
                                    ? 'bg-slate-100 text-slate-600'
                                    : isStreamLive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {isClosedHours
                                ? 'NGỪNG CHẠY (23:00 – 05:00)'
                                : isStreamLive
                                    ? 'LIVE STREAM (Redis Pub/Sub)'
                                    : 'Mô phỏng dự phòng'}
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isClosedHours
                            ? 'Tất cả các đoàn tàu đã về ga đầu/cuối và ngừng vận hành từ 23:00 đến 05:00.'
                            : isStreamLive
                                ? 'Đang nhận telemetry mỗi 3 giây qua SSE + Redis Pub/Sub'
                                : 'Vị trí giả lập dựa trên khoảng cách và thời gian thực tế'}
                    </p>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Lượt đi (về Bến Thành)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Lượt về (đi Suối Tiên)</span>
                    </div>
                </div>
            </div>

            <div className="relative mt-12 pt-16 pb-24 overflow-x-auto no-scrollbar">
                <div className="relative min-w-[1600px] px-12">
                    {/* Unified Curved Loop Track */}
                    <div className="absolute top-[27px] left-6 right-6 h-[26px] border-[6px] border-t-blue-400 border-b-green-400 border-x-slate-300 rounded-full z-0 opacity-80" />

                    <div className="flex justify-between relative">
                    {stations.map((st, i) => (
                        <div key={st.id} className="relative w-32 flex flex-col items-center">
                            {/* Station Dot - Fixed alignment with line */}
                            <div className="absolute top-[40px] -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[6px] border-gray-200 shadow-sm z-10 group-hover:border-blue-500 transition-colors duration-300" />
                            
                            {/* Station Label - Positioned below fixed line */}
                            <div className="mt-[65px] text-center w-full px-1">
                                <span className="text-[10px] font-bold text-gray-400 block mb-1">
                                    {st.sequence_order}
                                </span>
                                <div className="text-[11px] font-bold text-gray-700 leading-tight">
                                    {st.name}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Active Trains */}
                    {trains.map((train) => {
                        const startIdx = stations.findIndex(s => s.id === train.current_station.id);
                        const endIdx = train.next_station 
                            ? stations.findIndex(s => s.id === train.next_station?.id)
                            : startIdx;
                        
                        // Calculate position % on the track
                        const totalUnits = stations.length - 1;
                        let posPercent = (startIdx / totalUnits) * 100;
                        
                        if (train.status === 'moving' && startIdx !== -1 && endIdx !== -1) {
                            const diff = (endIdx - startIdx) / totalUnits;
                            posPercent += (diff * train.progress_to_next) * 100;
                        }

                        // Curve turnaround logic
                        let topPos = train.direction === 'outbound' ? 30 : 50;
                        let leftPos = `${posPercent}%`;

                        if (startIdx === 0 && train.direction === 'outbound' && train.status === 'idle') {
                            topPos = 40;
                            leftPos = `calc(0% - 26px)`;
                        } else if (startIdx === totalUnits && train.direction === 'inbound' && train.status === 'idle') {
                            topPos = 40;
                            leftPos = `calc(100% + 26px)`;
                        }

                        return (
                            <div 
                                key={train.train_number}
                                className="absolute -translate-y-1/2 -translate-x-1/2 z-30 transition-all duration-1000 ease-linear"
                                style={{ 
                                    left: leftPos,
                                    top: `${topPos}px`
                                }}
                            >
                                <div className={`relative flex flex-col items-center group cursor-pointer ${
                                    train.direction === 'outbound' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                    {/* Hover ID Badge */}
                                    <div className="absolute -top-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                                        <div className="bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-2xl flex items-center gap-2 whitespace-nowrap border border-gray-700">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                            Tàu {train.train_number}
                                        </div>
                                        {/* Little Arrow */}
                                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1 border-r border-b border-gray-700" />
                                    </div>

                                    {/* Status Badge - Now Highlighted Above Train */}
                                    <div className={`absolute -top-12 px-3 py-1 rounded-xl shadow-lg border-2 border-white flex items-center gap-1.5 whitespace-nowrap text-[10px] font-black uppercase tracking-wider text-white ring-2 ring-white/50 ${
                                        train.status === 'moving'
                                            ? (train.direction === 'outbound' ? 'bg-blue-600' : 'bg-green-600')
                                            : train.status === 'idle'
                                                ? 'bg-slate-600'
                                                : 'bg-amber-500'
                                    }`}>
                                        {train.status === 'moving' ? (
                                            <>
                                                <Navigation className="w-3 h-3 animate-pulse" />
                                                <span>Đang di chuyển</span>
                                            </>
                                        ) : train.status === 'idle' ? (
                                            <>
                                                <Clock className="w-3 h-3 text-white" />
                                                <span>Ngoài giờ</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3 text-white" />
                                                <span>Đang dừng ga</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Train Icon Circle */}
                                    <div className={`p-2 rounded-full shadow-lg border-2 border-white text-white ${
                                        train.status === 'idle'
                                            ? 'bg-slate-500'
                                            : train.direction === 'outbound'
                                                ? 'bg-blue-500'
                                                : 'bg-green-500'
                                    }`}>
                                        <Train className={`w-5 h-5 ${train.direction === 'inbound' ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveMetroTracker;

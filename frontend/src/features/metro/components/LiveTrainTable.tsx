'use client';

import React from 'react';
import { LiveTrain } from '../services/TrackingService';
import { Train, ArrowRight, Clock, Info } from 'lucide-react';

interface LiveTrainTableProps {
  trains: LiveTrain[];
}

const LiveTrainTable: React.FC<LiveTrainTableProps> = ({ trains }) => {
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          Bảng trạng thái vận hành chi tiết
        </h3>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Cập nhật mỗi 10 giây
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="px-6 py-4 whitespace-nowrap">Mã Tàu</th>
              <th className="px-6 py-4 whitespace-nowrap">Lượt chạy</th>
              <th className="px-6 py-4 whitespace-nowrap">Ga hiện tại</th>
              <th className="px-6 py-4 whitespace-nowrap">Ga tiếp theo</th>
              <th className="px-6 py-4 whitespace-nowrap">Thời gian tới</th>
              <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trains.map((train) => (
              <tr key={train.train_number} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${train.direction === 'outbound' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      <Train className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-700">{train.train_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                    train.direction === 'outbound' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {train.direction === 'outbound' ? 'Lượt đi' : 'Lượt về'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-semibold text-gray-600">{train.current_station.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {train.next_station ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                      <ArrowRight className="w-3 h-3" />
                      {train.next_station.name}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Đang ở ga cuối</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-blue-600">
                    <Clock className="w-3 h-3" />
                    {formatTime(train.time_to_next_seconds)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${train.status === 'moving' ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className={`text-xs font-medium ${train.status === 'moving' ? 'text-blue-600' : 'text-amber-600'}`}>
                      {train.status === 'moving' ? 'Đang di chuyển' : 'Đang dừng ga'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveTrainTable;

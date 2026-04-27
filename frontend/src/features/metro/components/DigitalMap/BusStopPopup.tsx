import { BusStopMap } from "@/types/map";
import { Bus, MapPin, Navigation } from "lucide-react";

interface BusStopPopupProps {
  stop: BusStopMap;
}

export function BusStopPopup({ stop }: BusStopPopupProps) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;

  return (
    <div className="w-[300px] rounded-xl bg-white p-1">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          <Bus className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-slate-800">
            {stop.name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {stop.station_name ? (
              <span className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                Gần ga {stop.station_name}
              </span>
            ) : null}
            {stop.stop_type ? (
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {stop.stop_type}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-[13px] text-slate-600">
        {stop.address ? (
          <div className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{stop.address}</span>
          </div>
        ) : null}
        {stop.distance_to_station ? (
          <div>
            Cách ga khoảng <span className="font-semibold text-slate-800">{stop.distance_to_station} m</span>
          </div>
        ) : null}
        {stop.routes?.length ? (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tuyến kết nối
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stop.routes.map((route) => (
                <span
                  key={route}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {route}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {stop.note ? <div className="text-xs text-slate-500">{stop.note}</div> : null}
      </div>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-[13px] font-bold !text-white transition-all hover:bg-cyan-700 visited:!text-white"
      >
        <Navigation className="h-4 w-4" />
        Dẫn đường đến trạm bus
      </a>
    </div>
  );
}

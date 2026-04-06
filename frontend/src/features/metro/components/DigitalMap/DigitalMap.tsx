"use client";

import dynamic from "next/dynamic";

const DigitalMapClient = dynamic(
  () => import("./DigitalMapClient"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export function DigitalMap() {
  return <DigitalMapClient />;
}

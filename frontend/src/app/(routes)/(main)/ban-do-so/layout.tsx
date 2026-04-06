import { ReactNode } from "react";

export default function MapLayout({ children }: { children: ReactNode }) {
  // We use absolute positioning inside to break out of the main max-w-6xl container if necessary, 
  // or we can override the layout using page-specific styling.
  // Since the parent layout.tsx has `<main className="mx-auto max-w-6xl px-4 py-8">`, 
  // we can use negative margins or absolute to make it full width if we wanted, 
  // but a simpler way is to just let Map handle its own full width via negative margins on mobile/desktop.
  
  return (
    <div className="-mx-4 -my-8 md:-mx-8 md:-ml-[calc((100vw-72rem)/2)] md:-mr-[calc((100vw-72rem)/2)] xl:w-screen 2xl:-ml-[calc((100vw-72rem)/2)] relative overflow-hidden">
      <div className="w-full h-full xl:w-screen">
          {children}
      </div>
    </div>
  );
}

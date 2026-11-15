"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/shared/PageTransition";
import { ChatboxWidget } from "@/components/chatbox/ChatboxWidget";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isMapPage = pathname.startsWith("/ban-do-so");

  if (isAdmin) {
    // Admin uses its own layout + header, no client navbar/footer/chat.
    return <PageTransition>{children}</PageTransition>;
  }

  return (
    <div className="min-h-dvh bg-metro-bg">
      <Navbar />
      <main className={isMapPage ? "mx-auto max-w-6xl px-4 pt-8 pb-0" : "mx-auto max-w-6xl px-4 py-8"}>
        <PageTransition>{children}</PageTransition>
      </main>
      {!isMapPage && <Footer />}
      <ChatboxWidget />
    </div>
  );
}


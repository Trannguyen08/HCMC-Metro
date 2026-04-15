import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "@/app/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";
import { PageTransition } from "@/components/shared/PageTransition";
import { ChatboxWidget } from "@/components/chatbox/ChatboxWidget";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Metro HCM | Đặt vé & Tra cứu",
  description: "Hệ thống đặt vé Metro HCM (mock frontend)",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-dvh bg-metro-bg">
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <ChatboxWidget />
          </div>
        </Providers>
      </body>
    </html>
  );
}

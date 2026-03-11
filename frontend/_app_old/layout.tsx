import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Fullstack Starter",
  description: "Next.js + Django + Postgres starter"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}


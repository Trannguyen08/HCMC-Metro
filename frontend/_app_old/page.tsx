"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type HealthResponse = {
  status: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthResponse>("/health/")
      .then((res) => setHealth(res.data))
      .catch((err) => {
        console.error(err);
        setError("Could not reach backend API");
      });
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Fullstack Starter
        </h1>
        <p className="text-slate-300">
          Next.js 14 (App Router) + Django REST + Postgres + Docker.
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-100">
          Backend connection
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Hitting `{process.env.NEXT_PUBLIC_API_URL}/health/`
        </p>
        <div className="mt-4">
          {health && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              API status: {health.status}
            </span>
          )}
          {error && (
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-300">
              {error}
            </span>
          )}
          {!health && !error && (
            <span className="text-sm text-slate-400">Checking API...</span>
          )}
        </div>
      </section>
    </div>
  );
}


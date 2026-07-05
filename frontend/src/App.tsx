import { Gauge } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react";

import { DriverProfilePage } from "./components/DriverProfilePage";
import { RacePanel } from "./components/RacePanel"
import { StandingsPanel } from "./components/StandingsPanel"
import { SyncPill } from "./components/SyncPill"
import { WeatherPanel } from "./components/WeatherPanel"
import { fetchDashboardData } from "./lib/dashboardApi"
import type { DashboardData, StandingMode } from "./types"

const WEATHER_POLL_MS = 10 * 60 * 1000;

function App() {
  const [mode, setMode] = useState<StandingMode>("drivers")
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    const payload = await fetchDashboardData(signal);
    setData(payload);
    setError("");
    return payload;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let refreshTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let weatherPollId: ReturnType<typeof setInterval> | undefined;

    const scheduleRefresh = (nextRefreshAt?: string | null) => {
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      if (!nextRefreshAt) return;

      const delay = new Date(nextRefreshAt).getTime() - Date.now() + 1000;
      if (Number.isNaN(delay) || delay <= 0) return;

      refreshTimeoutId = setTimeout(() => {
        void refresh();
      }, delay);
    };

    const refresh = async () => {
      try {
        const payload = await loadDashboard(controller.signal);
        if (cancelled) return;
        scheduleRefresh(payload.sync.nextRefreshAt);
      } catch (err: unknown) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        )
          return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void refresh();
    weatherPollId = setInterval(() => {
      void refresh();
    }, WEATHER_POLL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      if (weatherPollId) clearInterval(weatherPollId);
    };
  }, [loadDashboard]);

  const standings = useMemo(() => {
    if (!data) return []
    return mode === "drivers" ? data.drivers : data.constructors
  }, [data, mode])

  return (
    <main className="min-h-screen bg-[#090d14] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-400">
              <Gauge size={17} />
              F1 Dashboard MVP
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-white sm:text-4xl">
              Championship pulse
            </h1>
          </div>
          <SyncPill sync={data?.sync} />
        </header>

        {error ? (
          <div className="rounded-md border border-red-900/70 bg-red-950/70 px-4 py-3 text-sm text-red-100">
            {error}. Start the Django backend and fetch data once to populate
            the dashboard.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          {selectedDriverId ? (
            <DriverProfilePage
              driverId={selectedDriverId}
              onBack={() => setSelectedDriverId(null)}
            />
          ) : (
            <StandingsPanel
              isLoading={isLoading}
              mode={mode}
              onModeChange={setMode}
              rows={standings}
              onDriverSelect={setSelectedDriverId}
            />
          )}

          <aside className="flex flex-col gap-5">
            <RacePanel race={data?.nextRace ?? null} isLoading={isLoading} />
            <WeatherPanel race={data?.nextRace ?? null} isLoading={isLoading} />
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App

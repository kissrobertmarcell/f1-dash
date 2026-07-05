import { Gauge } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { RacePanel } from "./components/RacePanel"
import { StandingsPanel } from "./components/StandingsPanel"
import { SyncPill } from "./components/SyncPill"
import { WeatherPanel } from "./components/WeatherPanel"
import { fetchDashboardData } from "./lib/dashboardApi"
import type { DashboardData, StandingMode } from "./types"

function App() {
  const [mode, setMode] = useState<StandingMode>("drivers")
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

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
            {error}. Start the Django backend and fetch data once to populate the dashboard.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <StandingsPanel
            isLoading={isLoading}
            mode={mode}
            onModeChange={setMode}
            rows={standings}
          />

          <aside className="flex flex-col gap-5">
            <RacePanel race={data?.nextRace ?? null} isLoading={isLoading} />
            <WeatherPanel race={data?.nextRace ?? null} isLoading={isLoading} />
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App

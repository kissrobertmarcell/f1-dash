import { CloudSun, Umbrella, Wind } from "lucide-react"
import type { ReactNode } from "react"

import { EmptyState } from "./common/EmptyState"
import { PanelTitle } from "./common/PanelTitle"
import { BlockSkeleton } from "./common/Skeletons"
import type { Race } from "../types"

type WeatherPanelProps = {
  race: Race | null
  isLoading: boolean
}

export function WeatherPanel({ race, isLoading }: WeatherPanelProps) {
  const weather = race?.weather

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-panel">
      <PanelTitle icon={<CloudSun size={20} />} title="Race location weather" />
      {isLoading ? <BlockSkeleton /> : null}
      {!isLoading && weather ? (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-black text-white">
                {weather.temperatureC ?? "--"}
                {"\u00b0C"}
              </div>
              <div className="text-sm font-semibold text-slate-400">{weather.summary}</div>
            </div>
            <div className="rounded-md bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950">
              Feels {weather.apparentTemperatureC ?? "--"}
              {"\u00b0C"}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <WeatherMetric icon={<Umbrella size={17} />} label="Rain" value={`${weather.precipitationMm ?? 0} mm`} />
            <WeatherMetric icon={<Wind size={17} />} label="Wind" value={`${weather.windSpeedKmh ?? "--"} km/h`} />
          </div>
        </div>
      ) : null}
      {!isLoading && !weather ? <EmptyState>Live weather unavailable.</EmptyState> : null}
    </section>
  )
}

function WeatherMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  )
}

import * as ToggleGroup from "@radix-ui/react-toggle-group"
import {
  CalendarClock,
  CloudSun,
  Flag,
  Gauge,
  MapPin,
  RefreshCcw,
  Trophy,
  Umbrella,
  Wind,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import arFlag from "flag-icons/flags/4x3/ar.svg"
import auFlag from "flag-icons/flags/4x3/au.svg"
import brFlag from "flag-icons/flags/4x3/br.svg"
import caFlag from "flag-icons/flags/4x3/ca.svg"
import deFlag from "flag-icons/flags/4x3/de.svg"
import esFlag from "flag-icons/flags/4x3/es.svg"
import fiFlag from "flag-icons/flags/4x3/fi.svg"
import frFlag from "flag-icons/flags/4x3/fr.svg"
import gbFlag from "flag-icons/flags/4x3/gb.svg"
import itFlag from "flag-icons/flags/4x3/it.svg"
import jpFlag from "flag-icons/flags/4x3/jp.svg"
import mcFlag from "flag-icons/flags/4x3/mc.svg"
import mxFlag from "flag-icons/flags/4x3/mx.svg"
import nlFlag from "flag-icons/flags/4x3/nl.svg"
import nzFlag from "flag-icons/flags/4x3/nz.svg"
import thFlag from "flag-icons/flags/4x3/th.svg"
import usFlag from "flag-icons/flags/4x3/us.svg"

type StandingMode = "drivers" | "constructors"

type DriverStanding = {
  position: number
  driverId: string
  name: string
  code: string
  nationality: string
  constructor: string
  points: number
  wins: number
}

type ConstructorStanding = {
  position: number
  constructorId: string
  name: string
  nationality: string
  points: number
  wins: number
}

type Race = {
  round: number
  raceName: string
  circuitName: string
  locality: string
  country: string
  schedule: Record<string, string | null>
  weather: null | {
    temperatureC: number | null
    apparentTemperatureC: number | null
    precipitationMm: number | null
    windSpeedKmh: number | null
    summary: string
    fetchedAt: string
  }
}

type DashboardData = {
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  nextRace: Race | null
  sync: {
    lastSuccessAt: string | null
    nextRefreshAt: string | null
    error: string
  }
}

const scheduleLabels: Record<string, string> = {
  practice1: "Practice 1",
  practice2: "Practice 2",
  practice3: "Practice 3",
  qualifying: "Qualifying",
  sprint: "Sprint",
  race: "Race",
}

const nationalityFlags: Record<string, string> = {
  Argentine: arFlag,
  Australian: auFlag,
  Brazilian: brFlag,
  British: gbFlag,
  Canadian: caFlag,
  Dutch: nlFlag,
  Finnish: fiFlag,
  French: frFlag,
  German: deFlag,
  Italian: itFlag,
  Japanese: jpFlag,
  Mexican: mxFlag,
  Monegasque: mcFlag,
  "New Zealander": nzFlag,
  Spanish: esFlag,
  Thai: thFlag,
  American: usFlag,
}

function App() {
  const [mode, setMode] = useState<StandingMode>("drivers")
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Dashboard API unavailable")
        }
        return response.json() as Promise<DashboardData>
      })
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

function SyncPill({ sync }: { sync?: DashboardData["sync"] }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm shadow-sm">
      <RefreshCcw size={16} className="text-emerald-400" />
      <span className="text-slate-400">Next standings refresh</span>
      <strong className="font-semibold text-white">
        {formatDateTime(sync?.nextRefreshAt) ?? "waiting for data"}
      </strong>
    </div>
  )
}

function StandingsPanel({
  isLoading,
  mode,
  onModeChange,
  rows,
}: {
  isLoading: boolean
  mode: StandingMode
  onModeChange: (mode: StandingMode) => void
  rows: Array<DriverStanding | ConstructorStanding>
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 shadow-panel">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-red-600 text-white">
            <Trophy size={21} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Standings</h2>
            <p className="text-sm text-slate-400">Stored championship data from the backend cache</p>
          </div>
        </div>

        <ToggleGroup.Root
          className="grid grid-cols-2 rounded-md bg-slate-900 p-1"
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) onModeChange(value as StandingMode)
          }}
        >
          <ToggleGroup.Item className={segmentClass(mode === "drivers")} value="drivers">
            Drivers
          </ToggleGroup.Item>
          <ToggleGroup.Item className={segmentClass(mode === "constructors")} value="constructors">
            Constructors
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            <tr>
              <th className="w-16 px-4 py-3">Pos</th>
              <th className="px-4 py-3">{mode === "drivers" ? "Driver" : "Constructor"}</th>
              <th className="px-4 py-3">{mode === "drivers" ? "Team" : "Nation"}</th>
              <th className="px-4 py-3 text-right">Wins</th>
              <th className="px-4 py-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? <SkeletonRows /> : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                  No cached standings yet.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => {
                  const isDriver = "driverId" in row
                  return (
                    <tr key={isDriver ? row.driverId : row.constructorId} className="hover:bg-slate-900/70">
                      <td className="px-4 py-3 font-bold text-white">{row.position}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{row.name}</div>
                        {isDriver && row.code ? (
                          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-red-300">
                            <FlagIcon nationality={row.nationality} />
                            {row.code}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {isDriver ? row.constructor : row.nationality}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{row.wins}</td>
                      <td className="px-4 py-3 text-right font-black text-white">{row.points}</td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RacePanel({ race, isLoading }: { race: Race | null; isLoading: boolean }) {
  const schedule = race
    ? Object.entries(race.schedule).filter(([, value]) => Boolean(value))
    : []

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-panel">
      <PanelTitle icon={<Flag size={20} />} title="Next race" />
      {isLoading ? <BlockSkeleton /> : null}
      {!isLoading && race ? (
        <div className="mt-4">
          <h2 className="text-2xl font-black text-white">{race.raceName}</h2>
          <div className="mt-2 flex items-start gap-2 text-sm text-slate-300">
            <MapPin size={16} className="mt-0.5 text-red-400" />
            <span>
              {race.circuitName}, {race.locality}, {race.country}
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {schedule.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2">
                <span className="text-sm font-semibold text-slate-300">{scheduleLabels[key]}</span>
                <span className="text-sm text-white">{formatDateTime(value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isLoading && !race ? <EmptyState>No cached race schedule yet.</EmptyState> : null}
    </section>
  )
}

function WeatherPanel({ race, isLoading }: { race: Race | null; isLoading: boolean }) {
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
                {weather.temperatureC ?? "--"}°C
              </div>
              <div className="text-sm font-semibold text-slate-400">{weather.summary}</div>
            </div>
            <div className="rounded-md bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950">
              Feels {weather.apparentTemperatureC ?? "--"}°C
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

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
      <span className="text-red-400">{icon}</span>
      {title}
    </div>
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

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-md bg-slate-900 p-4 text-sm text-slate-400">{children}</div>
}

function BlockSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-7 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-16 w-full animate-pulse rounded bg-slate-800" />
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, index) => (
    <tr key={index}>
      <td className="px-4 py-3" colSpan={5}>
        <div className="h-6 animate-pulse rounded bg-slate-800" />
      </td>
    </tr>
  ))
}

function segmentClass(isActive: boolean) {
  const base = "rounded px-3 py-2 text-sm font-bold outline-none transition"
  return isActive
    ? `${base} bg-slate-700 text-white shadow-sm`
    : `${base} text-slate-400 hover:text-white`
}

function FlagIcon({ nationality }: { nationality: string }) {
  const flag = nationalityFlags[nationality]
  if (!flag) return null
  return (
    <img
      alt={nationality}
      className="h-3.5 w-5 rounded-sm object-cover"
      src={flag}
      title={nationality}
    />
  )
}

function formatDateTime(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default App

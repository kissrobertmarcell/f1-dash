import * as ToggleGroup from "@radix-ui/react-toggle-group"
import { Trophy } from "lucide-react"

import { FlagIcon } from "./FlagIcon"
import { SkeletonRows } from "./common/Skeletons"
import type { StandingMode, StandingRow } from "../types"

type StandingsPanelProps = {
  isLoading: boolean
  mode: StandingMode
  onModeChange: (mode: StandingMode) => void
  rows: StandingRow[]
}

export function StandingsPanel({
  isLoading,
  mode,
  onModeChange,
  rows,
}: StandingsPanelProps) {
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
            if (isStandingMode(value)) onModeChange(value)
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
            {!isLoading ? rows.map((row) => <StandingTableRow key={standingKey(row)} row={row} />) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StandingTableRow({ row }: { row: StandingRow }) {
  const isDriver = "driverId" in row

  return (
    <tr className="hover:bg-slate-900/70">
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
      <td className="px-4 py-3 text-slate-300">{isDriver ? row.constructor : row.nationality}</td>
      <td className="px-4 py-3 text-right font-medium">{row.wins}</td>
      <td className="px-4 py-3 text-right font-black text-white">{row.points}</td>
    </tr>
  )
}

function standingKey(row: StandingRow) {
  return "driverId" in row ? row.driverId : row.constructorId
}

function segmentClass(isActive: boolean) {
  const base = "rounded px-3 py-2 text-sm font-bold outline-none transition"
  return isActive
    ? `${base} bg-slate-700 text-white shadow-sm`
    : `${base} text-slate-400 hover:text-white`
}

function isStandingMode(value: string): value is StandingMode {
  return value === "drivers" || value === "constructors"
}

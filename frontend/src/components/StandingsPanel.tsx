import { Flag, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { FlagIcon } from "./FlagIcon";
import { SkeletonRows } from "./common/Skeletons";
import { fetchLastRaceResults } from "../lib/dashboardApi";
import {
  isDriverStanding,
  panelModeSchema,
  type LastRaceResults,
  type PanelMode,
  type RaceResultEntry,
  type StandingRow,
} from "../lib/schemas";

type StandingsPanelProps = {
  isLoading: boolean;
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
  rows: StandingRow[];
  onDriverSelect?: (driverId: string) => void;
};

export function StandingsPanel({
  isLoading,
  mode,
  onModeChange,
  rows,
  onDriverSelect,
}: StandingsPanelProps) {
  const [raceResults, setRaceResults] = useState<LastRaceResults | null>(null);
  const [resultsError, setResultsError] = useState("");
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  useEffect(() => {
    if (mode !== "results") return;

    const controller = new AbortController();
    setIsLoadingResults(true);
    setResultsError("");

    fetchLastRaceResults(controller.signal)
      .then((data) => setRaceResults(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResultsError(
          err instanceof Error ? err.message : "Unable to load race results",
        );
      })
      .finally(() => setIsLoadingResults(false));

    return () => controller.abort();
  }, [mode]);

  const showingResults = mode === "results";
  const title = showingResults
    ? raceResults?.race
      ? `${raceResults.race.raceName} results`
      : "Last race results"
    : "Standings";
  const busy = showingResults ? isLoadingResults : isLoading;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 shadow-panel">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-red-600 text-white">
            {showingResults ? <Flag size={21} /> : <Trophy size={21} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">
              {showingResults
                ? "Classification from the most recently completed race"
                : "Stored championship data from the backend cache"}
            </p>
          </div>
        </div>

        <select
          aria-label="Panel view"
          value={mode}
          onChange={(event) => {
            const parsed = panelModeSchema.safeParse(event.target.value);
            if (parsed.success) onModeChange(parsed.data);
          }}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-red-500"
        >
          <option value="drivers">Driver standings</option>
          <option value="constructors">Constructor standings</option>
          <option value="results">Last race results</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm" aria-busy={busy}>
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            {showingResults ? (
              <tr>
                <th className="w-16 px-4 py-3">Pos</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3 text-right">Laps</th>
                <th className="px-4 py-3 text-right">Time / status</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            ) : (
              <tr>
                <th className="w-16 px-4 py-3">Pos</th>
                <th className="px-4 py-3">
                  {mode === "drivers" ? "Driver" : "Constructor"}
                </th>
                <th className="px-4 py-3">
                  {mode === "drivers" ? "Team" : "Nation"}
                </th>
                <th className="px-4 py-3 text-right">Wins</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {showingResults ? (
              <ResultsRows
                isLoading={isLoadingResults}
                error={resultsError}
                results={raceResults?.results ?? []}
                onDriverSelect={onDriverSelect}
              />
            ) : (
              <StandingsRows
                isLoading={isLoading}
                rows={rows}
                onDriverSelect={onDriverSelect}
              />
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StandingsRows({
  isLoading,
  rows,
  onDriverSelect,
}: {
  isLoading: boolean;
  rows: StandingRow[];
  onDriverSelect?: (driverId: string) => void;
}) {
  if (isLoading) return <SkeletonRows />;

  if (rows.length === 0) {
    return (
      <tr>
        <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
          No cached standings yet.
        </td>
      </tr>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <StandingTableRow
          key={standingKey(row)}
          row={row}
          onDriverSelect={onDriverSelect}
        />
      ))}
    </>
  );
}

function StandingTableRow({
  row,
  onDriverSelect,
}: {
  row: StandingRow;
  onDriverSelect?: (driverId: string) => void;
}) {
  const isDriver = isDriverStanding(row);

  return (
    <tr className="hover:bg-slate-900/70">
      <td className="px-4 py-3 font-bold text-white">{row.position}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (isDriver && onDriverSelect) {
              onDriverSelect(row.driverId);
            }
          }}
          className={`text-left ${isDriver ? "cursor-pointer text-white transition hover:text-red-300" : "text-white"}`}
          disabled={!isDriver || !onDriverSelect}
        >
          <div className="font-semibold">{row.name}</div>
        </button>
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
      <td className="px-4 py-3 text-right font-black text-white">
        {row.points}
      </td>
    </tr>
  );
}

function ResultsRows({
  isLoading,
  error,
  results,
  onDriverSelect,
}: {
  isLoading: boolean;
  error: string;
  results: RaceResultEntry[];
  onDriverSelect?: (driverId: string) => void;
}) {
  if (isLoading) return <SkeletonRows />;

  if (error) {
    return (
      <tr>
        <td className="px-4 py-8 text-center text-red-300" colSpan={5}>
          {error}
        </td>
      </tr>
    );
  }

  if (results.length === 0) {
    return (
      <tr>
        <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
          No race results yet.
        </td>
      </tr>
    );
  }

  return (
    <>
      {results.map((result) => (
        <ResultTableRow
          key={result.driverId}
          result={result}
          onDriverSelect={onDriverSelect}
        />
      ))}
    </>
  );
}

function ResultTableRow({
  result,
  onDriverSelect,
}: {
  result: RaceResultEntry;
  onDriverSelect?: (driverId: string) => void;
}) {
  return (
    <tr className="hover:bg-slate-900/70">
      <td className="px-4 py-3 font-bold text-white">{result.position}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onDriverSelect?.(result.driverId)}
          className={`text-left ${onDriverSelect ? "cursor-pointer text-white transition hover:text-red-300" : "text-white"}`}
          disabled={!onDriverSelect}
        >
          <div className="font-semibold">{result.driverName}</div>
        </button>
        <div className="mt-1 text-xs font-medium text-red-300">
          {result.driverCode ? `${result.driverCode} \u00b7 ` : ""}
          {result.constructor}
        </div>
      </td>
      <td className="px-4 py-3 text-right text-slate-300">{result.laps}</td>
      <td className="px-4 py-3 text-right text-slate-300">
        {result.time || result.status}
      </td>
      <td className="px-4 py-3 text-right font-black text-white">
        {result.points}
      </td>
    </tr>
  );
}

function standingKey(row: StandingRow) {
  return isDriverStanding(row) ? row.driverId : row.constructorId;
}

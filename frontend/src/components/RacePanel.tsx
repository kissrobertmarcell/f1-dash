import { Flag, MapPin } from "lucide-react";

import { EmptyState } from "./common/EmptyState";
import { PanelTitle } from "./common/PanelTitle";
import { BlockSkeleton } from "./common/Skeletons";
import { formatDateTime } from "../lib/format";
import type { Race, ScheduleKey } from "../lib/schemas";

const scheduleLabels: Record<ScheduleKey, string> = {
  practice1: "Practice 1",
  practice2: "Practice 2",
  practice3: "Practice 3",
  qualifying: "Qualifying",
  sprint: "Sprint",
  race: "Race",
};

type RacePanelProps = {
  race: Race | null;
  isLoading: boolean;
};

export function RacePanel({ race, isLoading }: RacePanelProps) {
  const schedule = race
    ? Object.entries(race.schedule).filter(
        (entry): entry is [ScheduleKey, string] => Boolean(entry[1]),
      )
    : [];

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
              <div
                key={key}
                className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2"
              >
                <span className="text-sm font-semibold text-slate-300">
                  {scheduleLabels[key]}
                </span>
                <span className="text-sm text-white">
                  {formatDateTime(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isLoading && !race ? (
        <EmptyState>No cached race schedule yet.</EmptyState>
      ) : null}
    </section>
  );
}

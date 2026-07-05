import { ArrowLeft, Flag, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchDriverProfile } from "../lib/dashboardApi";
import type { DriverProfileData } from "../types";

type DriverProfilePageProps = {
  driverId: string;
  onBack: () => void;
};

export function DriverProfilePage({
  driverId,
  onBack,
}: DriverProfilePageProps) {
  const [profile, setProfile] = useState<DriverProfileData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDriverProfile(driverId, controller.signal);
        setProfile(data);
        setError("");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Unable to load driver profile",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [driverId]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 shadow-panel">
      <div className="border-b border-slate-800 p-4 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-500 hover:text-white">
          <ArrowLeft size={16} />
          Back to standings
        </button>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-7 w-40 animate-pulse rounded bg-slate-800" />
            <div className="h-5 w-72 animate-pulse rounded bg-slate-800" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-900/70 bg-red-950/70 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : profile ? (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-400">
                  Driver profile
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  {profile.driver.name}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <Flag size={16} />
                  {profile.driver.nationality}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Current standing
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  #{profile.driver.position}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Team
                </p>
                <p className="mt-1 font-semibold text-white">
                  {profile.driver.constructor}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Points
                </p>
                <p className="mt-1 font-semibold text-white">
                  {profile.driver.points}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Wins
                </p>
                <p className="mt-1 font-semibold text-white">
                  {profile.driver.wins}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Trophy size={18} className="text-red-400" />
                <h3 className="text-lg font-bold text-white">
                  Results this season
                </h3>
              </div>
              {profile.results.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  No race results are available for this driver yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Round</th>
                        <th className="px-4 py-3">Race</th>
                        <th className="px-4 py-3">Circuit</th>
                        <th className="px-4 py-3 text-right">Pos</th>
                        <th className="px-4 py-3 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {profile.results.map((result) => (
                        <tr
                          key={`${result.round}-${result.raceName}`}
                          className="bg-slate-950/70">
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {result.round}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">
                              {result.raceName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {result.constructor}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {result.circuitName}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-white">
                            {result.position}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-white">
                            {result.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

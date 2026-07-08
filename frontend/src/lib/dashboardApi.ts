import type { ZodType } from "zod";

import {
  dashboardDataSchema,
  driverProfileDataSchema,
  lastRaceResultsSchema,
  type DashboardData,
  type DriverProfileData,
  type LastRaceResults,
} from "./schemas";

async function fetchJson<T>(
  url: string,
  schema: ZodType<T>,
  unavailableMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(unavailableMessage);
  }

  const data: unknown = await response.json();
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`${unavailableMessage}: unexpected payload shape`);
  }

  return result.data;
}

export function fetchDashboardData(
  signal?: AbortSignal,
): Promise<DashboardData> {
  return fetchJson(
    "/api/dashboard/",
    dashboardDataSchema,
    "Dashboard API unavailable",
    signal,
  );
}

export function fetchDriverProfile(
  driverId: string,
  signal?: AbortSignal,
): Promise<DriverProfileData> {
  return fetchJson(
    `/api/drivers/${driverId}/results/`,
    driverProfileDataSchema,
    "Driver profile API unavailable",
    signal,
  );
}

export function fetchLastRaceResults(
  signal?: AbortSignal,
): Promise<LastRaceResults> {
  return fetchJson(
    "/api/results/last/",
    lastRaceResultsSchema,
    "Race results API unavailable",
    signal,
  );
}

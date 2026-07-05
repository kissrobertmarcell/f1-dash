import type { DashboardData, DriverProfileData } from "../types";
import { isDashboardData } from "./guards";

export async function fetchDashboardData(
  signal?: AbortSignal,
): Promise<DashboardData> {
  const response = await fetch("/api/dashboard/", { signal });
  if (!response.ok) {
    throw new Error("Dashboard API unavailable");
  }

  const data: unknown = await response.json();
  if (!isDashboardData(data)) {
    throw new Error("Dashboard API returned an unexpected payload");
  }

  return data;
}

export async function fetchDriverProfile(
  driverId: string,
  signal?: AbortSignal,
): Promise<DriverProfileData> {
  const response = await fetch(`/api/drivers/${driverId}/results/`, { signal });
  if (!response.ok) {
    throw new Error("Driver profile API unavailable");
  }

  const data: unknown = await response.json();
  if (!isDriverProfileData(data)) {
    throw new Error("Driver profile API returned an unexpected payload");
  }

  return data;
}

function isDriverProfileData(value: unknown): value is DriverProfileData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.driver === "object" &&
    candidate.driver !== null &&
    Array.isArray(candidate.results)
  );
}

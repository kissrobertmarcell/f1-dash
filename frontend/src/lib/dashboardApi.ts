import type { DashboardData } from "../types"
import { isDashboardData } from "./guards"

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard/")
  if (!response.ok) {
    throw new Error("Dashboard API unavailable")
  }

  const data: unknown = await response.json()
  if (!isDashboardData(data)) {
    throw new Error("Dashboard API returned an unexpected payload")
  }

  return data
}

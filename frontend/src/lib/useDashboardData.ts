import { useCallback, useEffect, useState } from "react";

import { fetchDashboardData } from "./dashboardApi";
import type { DashboardData } from "./schemas";

// Fallback re-fetch of the *entire* dashboard (standings, schedule, and
// weather) on a fixed interval. This exists in case the race-based
// `nextRefreshAt` schedule below doesn't fire (e.g. the tab was
// backgrounded) and also keeps live weather reasonably fresh in between
// scheduled standings refreshes.
const FALLBACK_POLL_MS = 10 * 60 * 1000;

type UseDashboardDataResult = {
  data: DashboardData | null;
  error: string;
  isLoading: boolean;
};

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    const payload = await fetchDashboardData(signal);
    setData(payload);
    setError("");
    return payload;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let refreshTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let fallbackPollId: ReturnType<typeof setInterval> | undefined;

    const scheduleRefresh = (nextRefreshAt?: string | null) => {
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      if (!nextRefreshAt) return;

      const delay = new Date(nextRefreshAt).getTime() - Date.now() + 1000;
      if (Number.isNaN(delay) || delay <= 0) return;

      refreshTimeoutId = setTimeout(() => {
        void refresh();
      }, delay);
    };

    const refresh = async () => {
      try {
        const payload = await loadDashboard(controller.signal);
        if (cancelled) return;
        scheduleRefresh(payload.sync.nextRefreshAt);
      } catch (err: unknown) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        )
          return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void refresh();
    fallbackPollId = setInterval(() => {
      void refresh();
    }, FALLBACK_POLL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      if (fallbackPollId) clearInterval(fallbackPollId);
    };
  }, [loadDashboard]);

  return { data, error, isLoading };
}

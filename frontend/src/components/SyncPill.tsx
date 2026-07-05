import { AlertCircle, RefreshCcw } from "lucide-react"

import { formatDateTime } from "../lib/format"
import type { SyncState } from "../types"

type SyncPillProps = {
  sync?: SyncState
}

export function SyncPill({ sync }: SyncPillProps) {
  const hasError = Boolean(sync?.error)

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm ${
        hasError
          ? "border-amber-800/70 bg-amber-950/40"
          : "border-slate-700 bg-slate-900"
      }`}
    >
      {hasError ? (
        <AlertCircle size={16} className="text-amber-400" aria-hidden="true" />
      ) : (
        <RefreshCcw size={16} className="text-emerald-400" aria-hidden="true" />
      )}
      <span className={hasError ? "text-amber-300" : "text-slate-400"}>
        {hasError ? "Last refresh failed" : "Next standings refresh"}
      </span>
      <strong
        className="font-semibold text-white"
        title={hasError ? sync?.error : undefined}
      >
        {formatDateTime(sync?.nextRefreshAt) ?? "waiting for data"}
      </strong>
    </div>
  )
}

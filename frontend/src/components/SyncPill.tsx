import { RefreshCcw } from "lucide-react"

import { formatDateTime } from "../lib/format"
import type { SyncState } from "../types"

type SyncPillProps = {
  sync?: SyncState
}

export function SyncPill({ sync }: SyncPillProps) {
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

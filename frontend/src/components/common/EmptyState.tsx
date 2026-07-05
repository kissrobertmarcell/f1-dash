import type { ReactNode } from "react"

type EmptyStateProps = {
  children: ReactNode
}

export function EmptyState({ children }: EmptyStateProps) {
  return <div className="mt-4 rounded-md bg-slate-900 p-4 text-sm text-slate-400">{children}</div>
}

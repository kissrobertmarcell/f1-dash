import type { ReactNode } from "react"

type PanelTitleProps = {
  icon: ReactNode
  title: string
}

export function PanelTitle({ icon, title }: PanelTitleProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
      <span className="text-red-400">{icon}</span>
      {title}
    </div>
  )
}

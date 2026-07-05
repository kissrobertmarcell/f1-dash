export function BlockSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-7 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-16 w-full animate-pulse rounded bg-slate-800" />
    </div>
  )
}

export function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, index) => (
    <tr key={index}>
      <td className="px-4 py-3" colSpan={5}>
        <div className="h-6 animate-pulse rounded bg-slate-800" />
      </td>
    </tr>
  ))
}

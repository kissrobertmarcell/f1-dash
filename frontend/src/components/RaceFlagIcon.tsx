import { Flag } from "lucide-react"

import { countryFlags } from "../lib/flags"

type RaceFlagIconProps = {
  country?: string | null
  size?: number
}

export function RaceFlagIcon({ country, size = 20 }: RaceFlagIconProps) {
  const flag = country ? countryFlags[country] : undefined
  if (!flag) return <Flag size={size} />

  return (
    <img
      alt={country ?? "Race location"}
      className="h-4 w-6 rounded-sm object-cover"
      src={flag}
      title={country ?? undefined}
    />
  )
}

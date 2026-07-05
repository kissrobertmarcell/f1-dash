import { nationalityFlags } from "../lib/flags"

type FlagIconProps = {
  nationality: string
}

export function FlagIcon({ nationality }: FlagIconProps) {
  const flag = nationalityFlags[nationality]
  if (!flag) return null

  return (
    <img
      alt={nationality}
      className="h-3.5 w-5 rounded-sm object-cover"
      src={flag}
      title={nationality}
    />
  )
}

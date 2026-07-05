import type {
  ConstructorStanding,
  DashboardData,
  DriverStanding,
  Race,
  ScheduleKey,
  SyncState,
  Weather,
} from "../types"

const scheduleKeys: ScheduleKey[] = [
  "practice1",
  "practice2",
  "practice3",
  "qualifying",
  "sprint",
  "race",
]

export function isDashboardData(value: unknown): value is DashboardData {
  if (!isRecord(value)) return false
  return (
    isDriverArray(value.drivers) &&
    isConstructorArray(value.constructors) &&
    (value.nextRace === null || isRace(value.nextRace)) &&
    isSyncState(value.sync)
  )
}

function isDriverArray(value: unknown): value is DriverStanding[] {
  return Array.isArray(value) && value.every(isDriverStanding)
}

function isConstructorArray(value: unknown): value is ConstructorStanding[] {
  return Array.isArray(value) && value.every(isConstructorStanding)
}

function isDriverStanding(value: unknown): value is DriverStanding {
  if (!isRecord(value)) return false
  return (
    isNumber(value.position) &&
    isString(value.driverId) &&
    isString(value.name) &&
    isString(value.code) &&
    isString(value.nationality) &&
    isString(value.constructor) &&
    isNumber(value.points) &&
    isNumber(value.wins)
  )
}

function isConstructorStanding(value: unknown): value is ConstructorStanding {
  if (!isRecord(value)) return false
  return (
    isNumber(value.position) &&
    isString(value.constructorId) &&
    isString(value.name) &&
    isString(value.nationality) &&
    isNumber(value.points) &&
    isNumber(value.wins)
  )
}

function isRace(value: unknown): value is Race {
  if (!isRecord(value)) return false
  return (
    isNumber(value.round) &&
    isString(value.raceName) &&
    isString(value.circuitName) &&
    isString(value.locality) &&
    isString(value.country) &&
    isSchedule(value.schedule) &&
    (value.weather === null || isWeather(value.weather))
  )
}

function isSchedule(value: unknown): value is Race["schedule"] {
  if (!isRecord(value)) return false
  return scheduleKeys.every((key) => isNullableString(value[key]))
}

function isWeather(value: unknown): value is Weather {
  if (!isRecord(value)) return false
  return (
    isNullableNumber(value.temperatureC) &&
    isNullableNumber(value.apparentTemperatureC) &&
    isNullableNumber(value.precipitationMm) &&
    isNullableNumber(value.windSpeedKmh) &&
    isString(value.summary) &&
    isString(value.fetchedAt)
  )
}

function isSyncState(value: unknown): value is SyncState {
  if (!isRecord(value)) return false
  return (
    isNullableString(value.lastSuccessAt) &&
    isNullableString(value.nextRefreshAt) &&
    isString(value.error)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

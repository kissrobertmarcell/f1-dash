export type StandingMode = "drivers" | "constructors"

export type DriverStanding = {
  position: number
  driverId: string
  name: string
  code: string
  nationality: string
  constructor: string
  points: number
  wins: number
}

export type ConstructorStanding = {
  position: number
  constructorId: string
  name: string
  nationality: string
  points: number
  wins: number
}

export type StandingRow = DriverStanding | ConstructorStanding

export type ScheduleKey =
  | "practice1"
  | "practice2"
  | "practice3"
  | "qualifying"
  | "sprint"
  | "race"

export type Weather = {
  temperatureC: number | null
  apparentTemperatureC: number | null
  precipitationMm: number | null
  windSpeedKmh: number | null
  summary: string
  fetchedAt: string
}

export type Race = {
  round: number
  raceName: string
  circuitName: string
  locality: string
  country: string
  schedule: Record<ScheduleKey, string | null>
  weather: Weather | null
}

export type SyncState = {
  lastSuccessAt: string | null
  nextRefreshAt: string | null
  error: string
}

export type DriverProfile = {
  driverId: string;
  name: string;
  code: string;
  nationality: string;
  constructor: string;
  position: number;
  points: number;
  wins: number;
};

export type DriverRaceResult = {
  round: number;
  raceName: string;
  circuitName: string;
  date: string | null;
  position: number;
  points: number;
  grid: number;
  status: string;
  constructor: string;
};

export type DriverProfileData = {
  driver: DriverProfile;
  results: DriverRaceResult[];
};

export type DashboardData = {
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  nextRace: Race | null
  sync: SyncState
}

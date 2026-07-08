import { z } from "zod";

/**
 * Single source of truth for the shapes returned by the backend API.
 *
 * Static types are derived from these schemas with `z.infer`, and the same
 * schemas are used to validate payloads at runtime (see `dashboardApi.ts`).
 * This avoids maintaining a hand-written TypeScript type and a hand-written
 * type guard in parallel.
 */

export const panelModeSchema = z.enum(["drivers", "constructors", "results"]);
export type PanelMode = z.infer<typeof panelModeSchema>;

export const scheduleKeys = [
  "practice1",
  "practice2",
  "practice3",
  "qualifying",
  "sprint",
  "race",
] as const;

export const scheduleKeySchema = z.enum(scheduleKeys);
export type ScheduleKey = z.infer<typeof scheduleKeySchema>;

// Shared by the standings list (DriverStanding) and the driver profile page
// (DriverProfile) -- the backend serializes both from the same fields.
export const driverSummarySchema = z.object({
  position: z.number(),
  driverId: z.string(),
  name: z.string(),
  code: z.string(),
  nationality: z.string(),
  constructor: z.string(),
  points: z.number(),
  wins: z.number(),
});
export type DriverStanding = z.infer<typeof driverSummarySchema>;
export type DriverProfile = z.infer<typeof driverSummarySchema>;

export const constructorStandingSchema = z.object({
  position: z.number(),
  constructorId: z.string(),
  name: z.string(),
  nationality: z.string(),
  points: z.number(),
  wins: z.number(),
});
export type ConstructorStanding = z.infer<typeof constructorStandingSchema>;

export type StandingRow = DriverStanding | ConstructorStanding;

export function isDriverStanding(row: StandingRow): row is DriverStanding {
  return "driverId" in row;
}

export const weatherSchema = z.object({
  temperatureC: z.number().nullable(),
  apparentTemperatureC: z.number().nullable(),
  precipitationMm: z.number().nullable(),
  windSpeedKmh: z.number().nullable(),
  summary: z.string(),
  fetchedAt: z.string(),
});
export type Weather = z.infer<typeof weatherSchema>;

export const scheduleSchema = z.object({
  practice1: z.string().nullable(),
  practice2: z.string().nullable(),
  practice3: z.string().nullable(),
  qualifying: z.string().nullable(),
  sprint: z.string().nullable(),
  race: z.string().nullable(),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export const raceSchema = z.object({
  round: z.number(),
  raceName: z.string(),
  circuitName: z.string(),
  locality: z.string(),
  country: z.string(),
  schedule: scheduleSchema,
  weather: weatherSchema.nullable(),
});
export type Race = z.infer<typeof raceSchema>;

export const syncStateSchema = z.object({
  lastSuccessAt: z.string().nullable(),
  nextRefreshAt: z.string().nullable(),
  error: z.string(),
});
export type SyncState = z.infer<typeof syncStateSchema>;

export const dashboardDataSchema = z.object({
  drivers: z.array(driverSummarySchema),
  constructors: z.array(constructorStandingSchema),
  nextRace: raceSchema.nullable(),
  sync: syncStateSchema,
});
export type DashboardData = z.infer<typeof dashboardDataSchema>;

export const driverRaceResultSchema = z.object({
  round: z.number(),
  raceName: z.string(),
  circuitName: z.string(),
  date: z.string().nullable(),
  position: z.number(),
  points: z.number(),
  grid: z.number(),
  status: z.string(),
  constructor: z.string(),
});
export type DriverRaceResult = z.infer<typeof driverRaceResultSchema>;

export const driverProfileDataSchema = z.object({
  driver: driverSummarySchema,
  results: z.array(driverRaceResultSchema),
});
export type DriverProfileData = z.infer<typeof driverProfileDataSchema>;

export const raceResultEntrySchema = z.object({
  position: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverCode: z.string(),
  constructor: z.string(),
  grid: z.number(),
  laps: z.number(),
  status: z.string(),
  time: z.string(),
  points: z.number(),
});
export type RaceResultEntry = z.infer<typeof raceResultEntrySchema>;

export const raceSummarySchema = z.object({
  round: z.number(),
  raceName: z.string(),
  circuitName: z.string(),
  locality: z.string(),
  country: z.string(),
  date: z.string().nullable(),
});
export type RaceSummary = z.infer<typeof raceSummarySchema>;

export const lastRaceResultsSchema = z.object({
  race: raceSummarySchema.nullable(),
  results: z.array(raceResultEntrySchema),
});
export type LastRaceResults = z.infer<typeof lastRaceResultsSchema>;

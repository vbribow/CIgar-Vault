import { createHash } from "node:crypto";

const DEFAULT_DAILY_LIMIT = 20;
const MAX_DAILY_LIMIT = 100;
const DUPLICATE_WINDOW_MS = 60_000;

export class PlaceSearchGuardError extends Error {
  constructor(public readonly code: "duplicate_search" | "daily_limit" | "guard_unavailable", message: string, public readonly status: number) {
    super(message);
    this.name = "PlaceSearchGuardError";
  }
}

export function placeSearchDailyLimit(env: NodeJS.ProcessEnv = process.env) {
  const parsed = Number.parseInt(env.GOOGLE_PLACES_DAILY_USER_LIMIT || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_DAILY_LIMIT) : DEFAULT_DAILY_LIMIT;
}

export function placeSearchQueryHash(location: string) {
  return createHash("sha256").update(location.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex");
}

export type PlaceSearchEventRow = { id: number; created_at: string; properties?: { queryHash?: string; status?: string } };
type GuardDb = {
  from(table: string): any;
};

export async function reservePlaceSearch(db: GuardDb, userId: string, location: string, now = new Date()) {
  const queryHash = placeSearchQueryHash(location);
  const { data: reservation, error: insertError } = await db.from("product_events").insert({
    user_id: userId,
    event_type: "places-search",
    properties: { queryHash, status: "reserved" },
  }).select("id,created_at,properties").single();
  if (insertError || !reservation) throw new PlaceSearchGuardError("guard_unavailable", "Live lounge-search safeguards are temporarily unavailable.", 503);

  const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
  const { data, error } = await db.from("product_events").select("id,created_at,properties")
    .eq("user_id", userId).eq("event_type", "places-search").gte("created_at", dayStart.toISOString()).order("id", { ascending: true }).limit(MAX_DAILY_LIMIT + 25);
  if (error) throw new PlaceSearchGuardError("guard_unavailable", "Live lounge-search safeguards are temporarily unavailable.", 503);
  const rows = (data || []) as PlaceSearchEventRow[];
  const decision=placeSearchReservationDecision(rows,reservation.id,queryHash,placeSearchDailyLimit(),now);
  if (decision !== "allowed") {
    await db.from("product_events").update({ properties: { queryHash, status: "blocked" } }).eq("id", reservation.id);
    if (decision === "duplicate") throw new PlaceSearchGuardError("duplicate_search", "That lounge search was just requested. Please wait a moment before searching the same location again.", 429);
    throw new PlaceSearchGuardError("daily_limit", `Today’s protected lounge-search limit has been reached. Try again tomorrow.`, 429);
  }
  return { eventId: reservation.id as number, queryHash, dailyLimit: placeSearchDailyLimit(), usedToday: rows.filter(row => row.properties?.status !== "blocked" && row.id <= reservation.id).length };
}

export function placeSearchReservationDecision(rows:PlaceSearchEventRow[],reservationId:number,queryHash:string,dailyLimit:number,now=new Date()):"allowed"|"duplicate"|"daily_limit"{
 const duplicate=rows.some(row=>row.id!==reservationId&&row.properties?.queryHash===queryHash&&row.properties?.status!=="blocked"&&now.getTime()-new Date(row.created_at).getTime()<=DUPLICATE_WINDOW_MS);
 if(duplicate)return"duplicate";
 return rows.filter(row=>row.properties?.status!=="blocked").slice(0,dailyLimit).some(row=>row.id===reservationId)?"allowed":"daily_limit";
}

export async function finishPlaceSearch(db: GuardDb, eventId: number, queryHash: string, status: "completed" | "failed") {
  const { error } = await db.from("product_events").update({ properties: { queryHash, status } }).eq("id", eventId);
  if (error) throw new PlaceSearchGuardError("guard_unavailable", "Lounge-search usage could not be recorded safely.", 503);
}

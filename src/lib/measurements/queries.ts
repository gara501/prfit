import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { BodyMeasurement, MeasurementClient } from "./types";

type ProfileRelation = {
  first_name: string | null;
  last_name: string | null;
};

const numberOrNull = (value: number | string | null) =>
  value === null ? null : Number(value);

export async function getTrainerMeasurements(): Promise<{
  clients: MeasurementClient[];
  measurements: BodyMeasurement[];
  error: string | null;
}> {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const clientsPromise = supabase
    .from("trainer_clients")
    .select(
      "client_id, client:profiles!trainer_clients_client_id_fkey(first_name, last_name)",
    )
    .eq("trainer_id", account.user.id)
    .eq("is_active", true);
  const measurementsPromise = supabase
    .from("body_compositions")
    .select(
      "id, client_id, date, weight, height, fat_percentage, neck, chest, shoulders, waist, hips, right_arm, left_arm, right_leg, left_leg, notes, client:profiles!body_compositions_client_id_fkey(first_name, last_name)",
    )
    .order("date", { ascending: false });
  const [clientsResult, measurementsResult] = await Promise.all([
    clientsPromise,
    measurementsPromise,
  ]);
  const error = clientsResult.error ?? measurementsResult.error;
  if (error) return { clients: [], measurements: [], error: error.message };

  const clients = (clientsResult.data ?? []).map((row) => {
    const profile = row.client as unknown as ProfileRelation | null;
    return {
      id: row.client_id,
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
    };
  });
  const measurements = (measurementsResult.data ?? []).map(mapMeasurement);
  return { clients, measurements, error: null };
}

export async function getClientDashboardData(): Promise<{
  measurements: BodyMeasurement[];
  activeRoutines: number;
  sessionCount: number;
  error: string | null;
}> {
  const account = await requireRole("client");
  const supabase = createClient(await cookies());
  const measurementsPromise = supabase
    .from("body_compositions")
    .select(
      "id, client_id, date, weight, height, fat_percentage, neck, chest, shoulders, waist, hips, right_arm, left_arm, right_leg, left_leg, notes",
    )
    .order("date");
  const routinesPromise = supabase
    .from("routines")
    .select("id", { count: "exact", head: true })
    .eq("client_id", account.user.id)
    .eq("is_active", true)
    .eq("status", "published");
  const sessionsPromise = supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", account.user.id);
  const [measurementsResult, routinesResult, sessionsResult] =
    await Promise.all([measurementsPromise, routinesPromise, sessionsPromise]);
  const error =
    measurementsResult.error ?? routinesResult.error ?? sessionsResult.error;
  if (error) {
    return {
      measurements: [],
      activeRoutines: 0,
      sessionCount: 0,
      error: error.message,
    };
  }

  return {
    measurements: (measurementsResult.data ?? []).map(mapMeasurement),
    activeRoutines: routinesResult.count ?? 0,
    sessionCount: sessionsResult.count ?? 0,
    error: null,
  };
}

function mapMeasurement(row: {
  id: string;
  client_id: string;
  date: string;
  weight: number | string | null;
  height: number | string | null;
  fat_percentage: number | string | null;
  neck: number | string | null;
  chest: number | string | null;
  shoulders: number | string | null;
  waist: number | string | null;
  hips: number | string | null;
  right_arm: number | string | null;
  left_arm: number | string | null;
  right_leg: number | string | null;
  left_leg: number | string | null;
  notes: string | null;
  client?: unknown;
}): BodyMeasurement {
  const profile = row.client as ProfileRelation | null | undefined;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName:
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
      "Cliente",
    date: row.date,
    weight: numberOrNull(row.weight),
    height: numberOrNull(row.height),
    fatPercentage: numberOrNull(row.fat_percentage),
    neck: numberOrNull(row.neck),
    chest: numberOrNull(row.chest),
    shoulders: numberOrNull(row.shoulders),
    waist: numberOrNull(row.waist),
    hips: numberOrNull(row.hips),
    rightArm: numberOrNull(row.right_arm),
    leftArm: numberOrNull(row.left_arm),
    rightLeg: numberOrNull(row.right_leg),
    leftLeg: numberOrNull(row.left_leg),
    notes: row.notes ?? "",
  };
}

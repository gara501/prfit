import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  calculateGamificationSummary,
  type GamificationSummary,
  getCalendarDateInTimeZone,
  type ScheduledWorkoutStatus,
} from "./streak";

const emptySummary = calculateGamificationSummary([], "1970-01-01");

export async function getClientGamification(): Promise<{
  summary: GamificationSummary;
  error: string | null;
}> {
  const account = await requireRole("client");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("scheduled_workouts")
    .select("scheduled_date, status")
    .eq("client_id", account.user.id)
    .order("scheduled_date", { ascending: true });

  if (error) return { summary: emptySummary, error: error.message };

  const workouts = (data ?? []).map((workout) => ({
    scheduledDate: workout.scheduled_date,
    status: workout.status as ScheduledWorkoutStatus,
  }));

  return {
    summary: calculateGamificationSummary(
      workouts,
      getCalendarDateInTimeZone(),
    ),
    error: null,
  };
}

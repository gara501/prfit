import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function getClientCalendar() {
  const account = await requireRole("client");
  const supabase = createClient(await cookies());
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("scheduled_workouts")
    .select(
      "id, scheduled_date, day_number, status, routine:routines(name), workout_sessions(id, workout_session_sets(completed))",
    )
    .eq("client_id", account.user.id)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date");
  const events = (data ?? []).map((row) => {
    const session = (
      row.workout_sessions as unknown as Array<{
        id: string;
        workout_session_sets: Array<{ completed: boolean }>;
      }>
    )[0];
    const sets = session?.workout_session_sets ?? [];
    return {
      id: row.id,
      date: row.scheduled_date,
      dayNumber: row.day_number,
      status: row.status,
      routineName:
        (row.routine as unknown as { name: string } | null)?.name ?? "Rutina",
      sessionId: session?.id ?? "",
      plannedSets: sets.length,
      completedSets: sets.filter((set) => set.completed).length,
    };
  });
  const eligible = events.filter(
    (event) => event.date <= today && event.status !== "cancelled",
  );
  return {
    events,
    completed: eligible.filter((event) => event.status === "completed").length,
    eligible: eligible.length,
    plannedSets: events.reduce((total, event) => total + event.plannedSets, 0),
    completedSets: events.reduce(
      (total, event) => total + event.completedSets,
      0,
    ),
    error: error?.message ?? null,
  };
}

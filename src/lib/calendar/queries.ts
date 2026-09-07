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
      "id, routine_id, scheduled_date, day_number, status, routine:routines(name), workout_sessions(id, workout_session_sets(completed))",
    )
    .eq("client_id", account.user.id)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date");
  const routineIds = [...new Set((data ?? []).map((row) => row.routine_id))];
  const { data: prescribedSets, error: prescribedSetsError } = routineIds.length
    ? await supabase
        .from("routine_exercises")
        .select("routine_id, day_number, routine_exercise_sets(id)")
        .in("routine_id", routineIds)
    : { data: [], error: null };
  if (error || prescribedSetsError) {
    return {
      events: [],
      completed: 0,
      eligible: 0,
      plannedSets: 0,
      completedSets: 0,
      error: error?.message ?? prescribedSetsError?.message ?? null,
    };
  }
  const prescribedSetCount = new Map<string, number>();
  for (const exercise of prescribedSets ?? []) {
    const sets = exercise.routine_exercise_sets as unknown as Array<{
      id: string;
    }>;
    const key = `${exercise.routine_id}:${exercise.day_number}`;
    prescribedSetCount.set(
      key,
      (prescribedSetCount.get(key) ?? 0) + sets.length,
    );
  }
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
      plannedSets:
        sets.length ||
        prescribedSetCount.get(`${row.routine_id}:${row.day_number}`) ||
        0,
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
    error: null,
  };
}

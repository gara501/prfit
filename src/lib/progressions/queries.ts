import { cookies } from "next/headers";
import {
  getRoutineWorkspace,
  getTrainerRoutines,
} from "@/lib/routines/queries";
import { createClient } from "@/lib/supabase/server";

export async function getProgressionWorkspace(routineId?: string) {
  const { routines, error: routinesError } = await getTrainerRoutines();
  const published = routines.filter(
    (routine) => routine.status === "published",
  );
  const selectedRoutine =
    published.find((routine) => routine.id === routineId) ??
    published[0] ??
    null;
  if (!selectedRoutine) {
    return {
      routines: published,
      routine: null,
      rules: [],
      suggestions: [],
      error: routinesError,
    };
  }

  const [{ routine, error: workspaceError }, supabase] = await Promise.all([
    getRoutineWorkspace(selectedRoutine.id),
    createClient(await cookies()),
  ]);
  if (!routine) {
    return {
      routines: published,
      routine: null,
      rules: [],
      suggestions: [],
      error: workspaceError,
    };
  }
  const exerciseIds = routine.exercises.map((exercise) => exercise.id);
  const [rulesResult, suggestionsResult] = await Promise.all([
    supabase
      .from("routine_exercise_progression_rules")
      .select("*")
      .in("routine_exercise_id", exerciseIds),
    supabase
      .from("routine_progression_suggestions")
      .select("*")
      .eq("source_routine_id", routine.id)
      .order("generated_at", { ascending: false }),
  ]);
  return {
    routines: published,
    routine,
    rules: rulesResult.data ?? [],
    suggestions: suggestionsResult.data ?? [],
    error:
      routinesError ??
      workspaceError ??
      rulesResult.error?.message ??
      suggestionsResult.error?.message ??
      null,
  };
}

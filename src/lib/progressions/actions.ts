"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getRoutineWorkspace } from "@/lib/routines/queries";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};
const number = (formData: FormData, field: string) =>
  Number(text(formData, field));

export async function saveProgressionRule(formData: FormData) {
  const account = await requireRole("trainer");
  const routineId = text(formData, "routineId");
  const routineExerciseId = text(formData, "routineExerciseId");
  const strategy = text(formData, "strategy");
  const increment = number(formData, "incrementKg");
  const successes = number(formData, "successfulSessions");
  const targetEffortText = text(formData, "targetEffort");
  const targetEffort = targetEffortText ? Number(targetEffortText) : null;
  const deload = formData.get("deloadOnFail") === "on";
  const failures = number(formData, "failureSessions");
  const reduction = number(formData, "reductionPercent");
  const enabled = formData.get("enabled") === "on";
  if (
    !routineId ||
    !routineExerciseId ||
    !["double_progression", "fixed_increment", "manual"].includes(strategy) ||
    increment < 0 ||
    !Number.isInteger(successes) ||
    successes < 1 ||
    !Number.isInteger(failures) ||
    failures < 1 ||
    reduction <= 0 ||
    reduction >= 100 ||
    (targetEffort !== null &&
      (!Number.isInteger(targetEffort) ||
        targetEffort < 0 ||
        targetEffort > 10))
  ) {
    redirect(
      `/trainer/progressions?routine=${routineId}&error=Revisa+la+regla+de+progresión.`,
    );
  }
  const { routine } = await getRoutineWorkspace(routineId);
  const exercise = routine?.exercises.find(
    (item) => item.id === routineExerciseId,
  );
  if (!routine || routine.status !== "published" || !exercise)
    redirect("/trainer/progressions?error=La+rutina+no+está+disponible.");
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("routine_exercise_progression_rules")
    .upsert(
      {
        routine_exercise_id: routineExerciseId,
        trainer_id: account.user.id,
        client_id: routine.clientId,
        strategy,
        increment_kg: increment,
        successful_sessions_required: successes,
        target_effort: targetEffort,
        failure_sessions_required: failures,
        deload_on_fail: deload,
        reduction_percent: reduction,
        enabled,
      },
      { onConflict: "routine_exercise_id" },
    );
  redirect(
    `/trainer/progressions?routine=${routineId}${error ? `&error=${encodeURIComponent(error.message)}` : "&saved=1"}`,
  );
}

export async function generateProgressionSuggestions(formData: FormData) {
  const account = await requireRole("trainer");
  const routineId = text(formData, "routineId");
  const { routine } = await getRoutineWorkspace(routineId);
  if (!routine || routine.status !== "published")
    redirect("/trainer/progressions?error=La+rutina+no+está+disponible.");
  const supabase = createClient(await cookies());
  const { data: rules, error: rulesError } = await supabase
    .from("routine_exercise_progression_rules")
    .select("*")
    .in(
      "routine_exercise_id",
      routine.exercises.map((exercise) => exercise.id),
    )
    .eq("enabled", true);
  if (rulesError)
    redirect(
      `/trainer/progressions?routine=${routineId}&error=${encodeURIComponent(rulesError.message)}`,
    );
  await supabase
    .from("routine_progression_suggestions")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("source_routine_id", routineId)
    .eq("status", "pending");
  const { data: performances } = await supabase
    .from("workout_session_sets")
    .select(
      "exercise_id, reps, weight, actual_rir, actual_rpe, planned_set_type, workout_session:workout_sessions!inner(date, client_id, status)",
    )
    .in(
      "exercise_id",
      routine.exercises.map((exercise) => exercise.exerciseId),
    )
    .eq("completed", true);
  const suggestions = (rules ?? []).flatMap((rule) => {
    const block = routine.exercises.find(
      (exercise) => exercise.id === rule.routine_exercise_id,
    );
    if (!block) return [];
    const targets = block.sets.filter((set) => set.setType !== "warmup");
    const targetReps = Math.max(
      ...targets.map((set) => set.repsMax ?? set.reps ?? 0),
    );
    const baseWeight = Math.max(...targets.map((set) => set.weight ?? 0));
    const sessions = new Map<
      string,
      { date: string; reps: number; rir: number | null; rpe: number | null }
    >();
    for (const row of performances ?? []) {
      const session = row.workout_session as unknown as {
        date: string;
        client_id: string;
        status: string;
      } | null;
      if (
        !session ||
        session.client_id !== routine.clientId ||
        session.status !== "completed" ||
        row.exercise_id !== block.exerciseId ||
        row.planned_set_type === "warmup"
      )
        continue;
      const current = sessions.get(session.date) ?? {
        date: session.date,
        reps: 0,
        rir: null,
        rpe: null,
      };
      current.reps = Math.max(current.reps, row.reps ?? 0);
      current.rir = row.actual_rir ?? current.rir;
      current.rpe = row.actual_rpe ?? current.rpe;
      sessions.set(session.date, current);
    }
    const recent = [...sessions.values()].toSorted((a, b) =>
      b.date.localeCompare(a.date),
    );
    if (recent.length === 0) return [];
    const isSuccess = (item: (typeof recent)[number]) =>
      item.reps >= targetReps &&
      (rule.target_effort === null ||
        (routine.effortMetric === "rir"
          ? item.rir !== null && item.rir >= rule.target_effort
          : item.rpe !== null && item.rpe <= rule.target_effort));
    const streak = recent.findIndex((item) => !isSuccess(item));
    const successfulStreak = streak === -1 ? recent.length : streak;
    const failureStreak = recent.findIndex((item) => isSuccess(item));
    const failed = failureStreak === -1 ? recent.length : failureStreak;
    const shouldDeload =
      rule.deload_on_fail && failed >= rule.failure_sessions_required;
    const ready =
      rule.strategy === "manual" ||
      shouldDeload ||
      successfulStreak >= rule.successful_sessions_required;
    if (!ready) return [];
    const proposedWeight = shouldDeload
      ? Math.max(0, baseWeight * (1 - Number(rule.reduction_percent) / 100))
      : rule.strategy === "manual"
        ? null
        : baseWeight + Number(rule.increment_kg);
    return [
      {
        rule_id: rule.id,
        source_routine_id: routine.id,
        source_routine_exercise_id: block.id,
        trainer_id: account.user.id,
        client_id: routine.clientId,
        exercise_id: block.exerciseId,
        source_day_number: block.dayNumber,
        source_order_index: block.orderIndex,
        strategy: rule.strategy,
        proposed_weight: proposedWeight,
        rationale: shouldDeload
          ? `${failed} sesiones consecutivas sin cumplir la regla; propone reducción del ${rule.reduction_percent}%.`
          : rule.strategy === "manual"
            ? "Revisión manual requerida por la regla configurada."
            : `${successfulStreak} sesiones consecutivas cumplieron la regla; propone el siguiente incremento.`,
      },
    ];
  });
  if (suggestions.length > 0)
    await supabase.from("routine_progression_suggestions").insert(suggestions);
  revalidatePath("/trainer/progressions");
  redirect(
    `/trainer/progressions?routine=${routineId}&generated=${suggestions.length}`,
  );
}

export async function applyProgressionSuggestion(formData: FormData) {
  await requireRole("trainer");
  const routineId = text(formData, "routineId");
  const suggestionId = text(formData, "suggestionId");
  const manualWeight = text(formData, "manualWeight");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("apply_progression_suggestion", {
    p_suggestion_id: suggestionId,
    p_manual_weight: manualWeight ? Number(manualWeight) : null,
  });
  revalidatePath("/trainer/progressions");
  revalidatePath("/trainer/routines");
  redirect(
    error || !data
      ? `/trainer/progressions?routine=${routineId}&error=${encodeURIComponent(error?.message ?? "No fue posible aplicar la sugerencia.")}`
      : `/trainer/routines/${data}/edit`,
  );
}

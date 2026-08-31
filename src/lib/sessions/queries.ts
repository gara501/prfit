import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type {
  ClientRoutineOption,
  LiveWorkoutExercise,
  LiveWorkoutSession,
  WorkoutSessionListItem,
} from "./types";

export async function getClientSessionsHome(): Promise<{
  routines: ClientRoutineOption[];
  sessions: WorkoutSessionListItem[];
  error: string | null;
}> {
  await requireRole("client");
  const supabase = createClient(await cookies());
  const today = new Date().toISOString().slice(0, 10);
  const routinesPromise = supabase
    .from("routines")
    .select(
      "id, name, description, days_at_week, routine_exercises(day_number)",
    )
    .eq("is_active", true)
    .eq("status", "published")
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("start_date", { ascending: false });
  const sessionsPromise = supabase
    .from("workout_sessions")
    .select(
      "id, date, started_at, ended_at, duration_seconds, status, day_number, routine:routines!workout_sessions_routine_id_fkey(name), workout_session_sets(completed)",
    )
    .order("date", { ascending: false })
    .limit(20);
  const [routinesResult, sessionsResult] = await Promise.all([
    routinesPromise,
    sessionsPromise,
  ]);

  const error = routinesResult.error ?? sessionsResult.error;
  if (error) return { routines: [], sessions: [], error: error.message };

  const routines = (routinesResult.data ?? []).map((routine) => {
    const exerciseRows = routine.routine_exercises as unknown as Array<{
      day_number: number;
    }>;
    const countByDay = new Map<number, number>();
    for (const exercise of exerciseRows) {
      countByDay.set(
        exercise.day_number,
        (countByDay.get(exercise.day_number) ?? 0) + 1,
      );
    }
    return {
      id: routine.id,
      name: routine.name,
      description: routine.description ?? "",
      daysAtWeek: routine.days_at_week,
      days: [...countByDay.entries()]
        .map(([dayNumber, exerciseCount]) => ({ dayNumber, exerciseCount }))
        .toSorted((left, right) => left.dayNumber - right.dayNumber),
    };
  });

  const sessions = (sessionsResult.data ?? []).map((session) => {
    const routine = session.routine as unknown as { name: string } | null;
    const sets = session.workout_session_sets as unknown as Array<{
      completed: boolean;
    }>;
    return {
      id: session.id,
      routineName: routine?.name ?? "Rutina eliminada",
      date: session.date,
      startedAt: session.started_at,
      endedAt: session.ended_at ?? "",
      durationSeconds: session.duration_seconds,
      status: session.status as WorkoutSessionListItem["status"],
      dayNumber: session.day_number,
      completedSets: sets.filter((set) => set.completed).length,
      totalSets: sets.length,
    };
  });

  return { routines, sessions, error: null };
}

export async function getLiveWorkoutSession(
  sessionId: string,
): Promise<{ session: LiveWorkoutSession | null; error: string | null }> {
  await requireRole("client");
  const supabase = createClient(await cookies());
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(
      "id, client_id, date, started_at, ended_at, duration_seconds, status, notes, day_number, routine_id, routine:routines!workout_sessions_routine_id_fkey(name, trainer_id, effort_metric)",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return {
      session: null,
      error: sessionError.message,
    };
  }
  if (!session) return { session: null, error: null };

  const setsPromise = supabase
    .from("workout_session_sets")
    .select(
      "id, routine_exercise_id, exercise_id, set_number, reps, weight, completed, planned_reps_min, planned_reps_max, planned_weight, planned_target_rir, planned_target_rpe, planned_set_type, planned_tempo, planned_is_optional, actual_rir, actual_rpe, client_notes, deviation_reason, exercise:exercises!workout_session_sets_exercise_id_fkey(name, video_url)",
    )
    .eq("workout_session_id", sessionId);
  const planPromise = session.routine_id
    ? supabase
        .from("routine_exercises")
        .select(
          "id, exercise_id, order_index, technique_notes, routine_exercise_sets(set_number, rest_seconds)",
        )
        .eq("routine_id", session.routine_id)
    : Promise.resolve({ data: [], error: null });
  const [setsResult, planResult] = await Promise.all([
    setsPromise,
    planPromise,
  ]);
  const error = setsResult.error ?? planResult.error;
  if (error) return { session: null, error: error.message };

  const exerciseIds = [
    ...new Set((setsResult.data ?? []).map((row) => row.exercise_id)),
  ];
  const routineRelation = session.routine as unknown as {
    name: string;
    trainer_id: string;
    effort_metric: "rir" | "rpe";
  } | null;
  const permanentNotesResult =
    !routineRelation || exerciseIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("trainer_client_exercise_notes")
          .select("exercise_id, technical_notes")
          .eq("trainer_id", routineRelation.trainer_id)
          .eq("client_id", session.client_id)
          .in("exercise_id", exerciseIds);
  if (permanentNotesResult.error) {
    return { session: null, error: permanentNotesResult.error.message };
  }
  const historyResult =
    exerciseIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("workout_session_sets")
          .select(
            "routine_exercise_id, exercise_id, set_number, reps, weight, workout_session:workout_sessions!inner(date)",
          )
          .in("exercise_id", exerciseIds)
          .eq("completed", true)
          .neq("workout_session_id", sessionId)
          .order("workout_session(date)", { ascending: false });

  const previousBySet = new Map<
    string,
    { reps: number | null; weight: number | null; performedAt: string }
  >();
  for (const row of historyResult.data ?? []) {
    const workoutSession = row.workout_session as unknown as {
      date: string;
    } | null;
    if (!workoutSession) continue;
    const performance = {
      reps: row.reps,
      weight: row.weight === null ? null : Number(row.weight),
      performedAt: workoutSession.date,
    };
    const exerciseKey = `${row.exercise_id}:${row.set_number}`;
    if (!previousBySet.has(exerciseKey)) {
      previousBySet.set(exerciseKey, performance);
    }
    if (row.routine_exercise_id) {
      const blockKey = `${row.routine_exercise_id}:${row.set_number}`;
      if (!previousBySet.has(blockKey)) {
        previousBySet.set(blockKey, performance);
      }
    }
  }

  const planRows = planResult.data ?? [];
  const orderByExercise = new Map(
    planRows.map((row) => [row.id, row.order_index]),
  );
  const restBySet = new Map<string, number | null>();
  const techniqueByBlock = new Map(
    planRows.map((row) => [row.id, row.technique_notes ?? ""]),
  );
  const permanentNotesByExercise = new Map(
    (permanentNotesResult.data ?? []).map((note) => [
      note.exercise_id,
      note.technical_notes,
    ]),
  );
  for (const row of planRows) {
    const plannedSets = row.routine_exercise_sets as unknown as Array<{
      set_number: number;
      rest_seconds: number | null;
    }>;
    for (const set of plannedSets) {
      restBySet.set(`${row.id}:${set.set_number}`, set.rest_seconds);
    }
  }

  const exercisesById = new Map<string, LiveWorkoutExercise>();
  for (const row of setsResult.data ?? []) {
    const exerciseRelation = row.exercise as unknown as {
      name: string;
      video_url: string | null;
    } | null;
    const blockId = row.routine_exercise_id ?? `legacy:${row.exercise_id}`;
    const exercise: LiveWorkoutExercise = exercisesById.get(blockId) ?? {
      blockId,
      exerciseId: row.exercise_id,
      name: exerciseRelation?.name ?? "Ejercicio",
      videoUrl: exerciseRelation?.video_url ?? "",
      orderIndex: orderByExercise.get(blockId) ?? 999,
      techniqueNotes: techniqueByBlock.get(blockId) ?? "",
      clientExerciseNote: permanentNotesByExercise.get(row.exercise_id) ?? "",
      sets: [],
    };
    exercise.sets.push({
      id: row.id,
      routineExerciseId: row.routine_exercise_id,
      exerciseId: row.exercise_id,
      setNumber: row.set_number,
      reps: row.reps,
      weight: row.weight === null ? null : Number(row.weight),
      plannedRepsMin: row.planned_reps_min,
      plannedRepsMax: row.planned_reps_max,
      plannedWeight:
        row.planned_weight === null ? null : Number(row.planned_weight),
      plannedTargetEffort:
        routineRelation?.effort_metric === "rpe"
          ? row.planned_target_rpe
          : row.planned_target_rir,
      setType: row.planned_set_type,
      tempo: row.planned_tempo ?? "",
      isOptional: row.planned_is_optional,
      actualEffort:
        routineRelation?.effort_metric === "rpe"
          ? row.actual_rpe
          : row.actual_rir,
      clientNotes: row.client_notes ?? "",
      deviationReason: row.deviation_reason ?? "",
      restSeconds: restBySet.get(`${blockId}:${row.set_number}`) ?? null,
      completed: row.completed,
      previousPerformance:
        previousBySet.get(`${blockId}:${row.set_number}`) ??
        previousBySet.get(`${row.exercise_id}:${row.set_number}`) ??
        null,
    });
    exercisesById.set(blockId, exercise);
  }

  const exercises = [...exercisesById.values()]
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.toSorted(
        (left, right) => left.setNumber - right.setNumber,
      ),
    }))
    .toSorted((left, right) => left.orderIndex - right.orderIndex);
  const routine = routineRelation;

  return {
    session: {
      id: session.id,
      routineName: routine?.name ?? "Entrenamiento",
      startedAt: session.started_at,
      endedAt: session.ended_at ?? "",
      durationSeconds: session.duration_seconds,
      status: session.status as LiveWorkoutSession["status"],
      dayNumber: session.day_number,
      effortMetric: routine?.effort_metric ?? "rir",
      notes: session.notes ?? "",
      exercises,
      historyUnavailable: historyResult.error !== null,
    },
    error: null,
  };
}

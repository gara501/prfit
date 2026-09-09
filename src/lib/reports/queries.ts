import { readAll, readByIds, requireQuery } from "@/lib/supabase/read-all";
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { calculateProgressMetrics } from "./metrics";
import type {
  ProgressReportData,
  RoutineReportData,
  RoutineReportExercise,
} from "./types";

type ExportAccount = NonNullable<
  Awaited<ReturnType<typeof import("./auth").getExportAccount>>
>;

export async function getRoutineReportData(
  account: ExportAccount,
  routineId: string,
): Promise<RoutineReportData | null> {
  const admin = createAdminClient();
  const { data: routine } = await requireQuery(
    admin
      .from("routines")
      .select(
        "id,client_id,trainer_id,name,description,version_number,status,start_date,end_date,days_at_week,intensity_level,effort_metric,microcycle_id",
      )
      .eq("id", routineId)
      .maybeSingle(),
  );
  if (!routine) return null;

  const authorized =
    account.role === "admin" ||
    (account.role === "client" && routine.client_id === account.id) ||
    (account.role === "trainer" &&
      routine.trainer_id === account.id &&
      (await hasActiveAssignment(account, routine.client_id)));
  if (!authorized) return null;

  const [{ data: profiles }, { data: exerciseRows }] = await Promise.all([
    readAll(
      admin
        .from("profiles")
        .select("id,first_name,last_name")
        .in("id", [routine.client_id, routine.trainer_id])
        .order("id"),
    ),
    readAll(
      admin
        .from("routine_exercises")
        .select("id,exercise_id,day_number,order_index,technique_notes")
        .eq("routine_id", routine.id)
        .order("day_number")
        .order("order_index")
        .order("id"),
    ),
  ]);
  const routineExercises = exerciseRows ?? [];
  const exerciseIds = [
    ...new Set(routineExercises.map((row) => row.exercise_id)),
  ];
  const routineExerciseIds = routineExercises.map((row) => row.id);
  const [{ data: exercises }, { data: sets }, { data: notes }] =
    await Promise.all([
      exerciseIds.length
        ? readByIds(exerciseIds, (batch) =>
            admin
              .from("exercises")
              .select("id,name")
              .in("id", batch)
              .order("id"),
          )
        : Promise.resolve({ data: [] }),
      routineExerciseIds.length
        ? readByIds(routineExerciseIds, (batch) =>
            admin
              .from("routine_exercise_sets")
              .select(
                "routine_exercise_id,set_number,reps,reps_min,reps_max,weight,rest_seconds,target_rir,target_rpe,tempo,set_type,training_method,is_optional",
              )
              .in("routine_exercise_id", batch)
              .order("set_number")
              .order("id"),
          )
        : Promise.resolve({ data: [] }),
      exerciseIds.length
        ? readByIds(exerciseIds, (batch) =>
            admin
              .from("trainer_client_exercise_notes")
              .select("exercise_id,technical_notes")
              .eq("trainer_id", routine.trainer_id)
              .eq("client_id", routine.client_id)
              .in("exercise_id", batch)
              .order("id"),
          )
        : Promise.resolve({ data: [] }),
    ]);
  const names = new Map((exercises ?? []).map((item) => [item.id, item.name]));
  const clientNotes = new Map(
    (notes ?? []).map((item) => [item.exercise_id, item.technical_notes]),
  );
  const exercisesForReport: RoutineReportExercise[] = routineExercises.map(
    (exercise) => ({
      dayNumber: exercise.day_number,
      orderIndex: exercise.order_index,
      name: names.get(exercise.exercise_id) ?? "Ejercicio",
      techniqueNotes: exercise.technique_notes ?? "",
      clientNotes: clientNotes.get(exercise.exercise_id) ?? "",
      sets: (sets ?? [])
        .filter((set) => set.routine_exercise_id === exercise.id)
        .map((set) => ({
          setNumber: set.set_number,
          reps: set.reps,
          repsMin: set.reps_min,
          repsMax: set.reps_max,
          weight: set.weight,
          restSeconds: set.rest_seconds,
          targetRir: set.target_rir,
          targetRpe: set.target_rpe,
          tempo: set.tempo ?? "",
          setType: set.set_type,
          trainingMethod: set.training_method,
          optional: set.is_optional,
        })),
    }),
  );

  const profileName = (id: string) => {
    const profile = (profiles ?? []).find((item) => item.id === id);
    return `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  };

  return {
    id: routine.id,
    clientId: routine.client_id,
    clientName: profileName(routine.client_id) || "Cliente",
    trainerName: profileName(routine.trainer_id) || "Entrenador",
    name: routine.name,
    description: routine.description ?? "",
    goal: await getRoutineGoal(admin, routine.microcycle_id),
    versionNumber: routine.version_number,
    status: routine.status,
    startDate: routine.start_date,
    endDate: routine.end_date,
    daysAtWeek: routine.days_at_week,
    intensityLevel: routine.intensity_level,
    effortMetric: routine.effort_metric,
    exercises: exercisesForReport,
  };
}

export async function getProgressReportFormData(
  account: ExportAccount,
  clientId: string,
) {
  if (
    account.role !== "trainer" ||
    !(await hasActiveAssignment(account, clientId))
  ) {
    return null;
  }
  const admin = createAdminClient();
  const [{ data: client }, { data: sessions }] = await Promise.all([
    requireQuery(
      admin
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", clientId)
        .maybeSingle(),
    ),
    readAll(
      admin
        .from("workout_sessions")
        .select("id")
        .eq("client_id", clientId)
        .order("id"),
    ),
  ]);
  if (!client) return null;
  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: performedSets } = sessionIds.length
    ? await readByIds(sessionIds, (batch) =>
        admin
          .from("workout_session_sets")
          .select("exercise_id,executed_exercise_id")
          .in("workout_session_id", batch)
          .order("id"),
      )
    : { data: [] };
  const exerciseIds = [
    ...new Set(
      (performedSets ?? []).map(
        (set) => set.executed_exercise_id ?? set.exercise_id,
      ),
    ),
  ];
  const { data: exercises } = exerciseIds.length
    ? await readByIds(exerciseIds, (batch) =>
        admin
          .from("exercises")
          .select("id,name")
          .in("id", batch)
          .order("name")
          .order("id"),
      )
    : { data: [] };
  return {
    clientName:
      `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
      "Cliente",
    exercises: exercises ?? [],
  };
}

export async function getProgressReportData(
  account: ExportAccount,
  options: {
    clientId: string;
    from: string;
    to: string;
    anonymized: boolean;
    authorizationConfirmed: boolean;
    includeMeasurements: boolean;
    trainerNotes: string;
    exerciseIds: string[];
  },
): Promise<ProgressReportData | null> {
  if (
    account.role !== "trainer" ||
    !(await hasActiveAssignment(account, options.clientId))
  ) {
    return null;
  }
  const admin = createAdminClient();
  const [{ data: client }, { data: sessions }, { data: scheduled }] =
    await Promise.all([
      requireQuery(
        admin
          .from("profiles")
          .select("first_name,last_name")
          .eq("id", options.clientId)
          .maybeSingle(),
      ),
      readAll(
        admin
          .from("workout_sessions")
          .select("id,status,duration_seconds,date")
          .eq("client_id", options.clientId)
          .gte("date", options.from)
          .lte("date", options.to)
          .order("id"),
      ),
      readAll(
        admin
          .from("scheduled_workouts")
          .select("id,status")
          .eq("client_id", options.clientId)
          .gte("scheduled_date", options.from)
          .lte("scheduled_date", options.to)
          .neq("status", "cancelled")
          .order("id"),
      ),
    ]);
  if (!client) return null;
  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: performedSets } = sessionIds.length
    ? await readByIds(sessionIds, (batch) =>
        admin
          .from("workout_session_sets")
          .select(
            "workout_session_id,exercise_id,executed_exercise_id,completed,reps,weight",
          )
          .in("workout_session_id", batch)
          .order("id"),
      )
    : { data: [] };
  const allExerciseIds = [
    ...new Set(
      (performedSets ?? []).map(
        (set) => set.executed_exercise_id ?? set.exercise_id,
      ),
    ),
  ];
  const { data: exerciseRows } = allExerciseIds.length
    ? await readByIds(allExerciseIds, (batch) =>
        admin.from("exercises").select("id,name").in("id", batch).order("id"),
      )
    : { data: [] };
  const exerciseNames = new Map(
    (exerciseRows ?? []).map((exercise) => [exercise.id, exercise.name]),
  );
  const metrics = calculateProgressMetrics(
    sessions ?? [],
    performedSets ?? [],
    exerciseNames,
  );
  const selectedMetrics = options.exerciseIds.length
    ? metrics.exercises.filter((exercise) =>
        options.exerciseIds.includes(exercise.exerciseId),
      )
    : metrics.exercises.slice(0, 5);
  const { weightProgress, fatProgress } = options.includeMeasurements
    ? await getMeasurementProgress(
        admin,
        options.clientId,
        options.from,
        options.to,
      )
    : { weightProgress: [], fatProgress: [] };
  const plannedSessions = scheduled?.length ?? 0;

  return {
    clientId: options.clientId,
    clientName: options.anonymized
      ? "Cliente CardonaFit"
      : `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
        "Cliente",
    trainerName: options.anonymized ? "" : account.name,
    from: options.from,
    to: options.to,
    anonymized: options.anonymized,
    authorizationConfirmed: options.authorizationConfirmed,
    trainerNotes: options.anonymized ? "" : options.trainerNotes,
    plannedSessions,
    completedSessions: metrics.completedSessions,
    adherencePercent:
      plannedSessions > 0
        ? Math.min(
            100,
            Math.round((metrics.completedSessions / plannedSessions) * 100),
          )
        : null,
    completedSets: metrics.completedSets,
    totalReps: metrics.totalReps,
    volumeKg: metrics.volumeKg,
    totalDurationSeconds: metrics.totalDurationSeconds,
    exercises: selectedMetrics,
    weightProgress,
    fatProgress,
    healthStatus: options.anonymized
      ? "not_submitted"
      : await getHealthStatus(admin, options.clientId),
  };
}

async function hasActiveAssignment(account: ExportAccount, clientId: string) {
  const { data } = await account.supabase
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", account.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

async function getRoutineGoal(
  admin: ReturnType<typeof createAdminClient>,
  microcycleId: string | null,
) {
  if (!microcycleId) return "";
  const { data: microcycle } = await requireQuery(
    admin
      .from("training_microcycles")
      .select("objective,training_plan_id")
      .eq("id", microcycleId)
      .maybeSingle(),
  );
  if (!microcycle) return "";
  if (microcycle.objective) return microcycle.objective;
  const { data: plan } = await requireQuery(
    admin
      .from("training_plans")
      .select("goal")
      .eq("id", microcycle.training_plan_id)
      .maybeSingle(),
  );
  return plan?.goal ?? "";
}

async function getMeasurementProgress(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  from: string,
  to: string,
) {
  const { data } = await readAll(
    admin
      .from("body_compositions")
      .select("date,weight,fat_percentage")
      .eq("client_id", clientId)
      .gte("date", from)
      .lte("date", to)
      .order("date")
      .order("id"),
  );
  return {
    weightProgress: (data ?? [])
      .filter((row) => row.weight !== null)
      .map((row) => ({ date: row.date, value: row.weight as number })),
    fatProgress: (data ?? [])
      .filter((row) => row.fat_percentage !== null)
      .map((row) => ({ date: row.date, value: row.fat_percentage as number })),
  };
}

async function getHealthStatus(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
): Promise<ProgressReportData["healthStatus"]> {
  const { data: screening } = await requireQuery(
    admin
      .from("health_screenings")
      .select("id,has_critical_risk,expires_at")
      .eq("client_id", clientId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (!screening) return "not_submitted";
  const { data: review } = await requireQuery(
    admin
      .from("health_screening_reviews")
      .select("decision")
      .eq("screening_id", screening.id)
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (
    screening.has_critical_risk &&
    review?.decision !== "cleared" &&
    review?.decision !== "cleared_with_restrictions"
  ) {
    return "requires_clearance";
  }
  return screening.expires_at < new Date().toISOString()
    ? "expired"
    : "current";
}

import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { parseTemplateDefinition } from "./template-definition";
import type {
  EffortMetric,
  ExerciseOption,
  RoutineClient,
  RoutineDetail,
  RoutineListItem,
  RoutineTemplateDetail,
  RoutineTemplateListItem,
  RoutineVersionStatus,
} from "./types";

type ProfileRelation = {
  first_name: string | null;
  last_name: string | null;
};

const getName = (profile: ProfileRelation | null | undefined) =>
  `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
  "Cliente sin nombre";

export async function getTrainerRoutines(): Promise<{
  routines: RoutineListItem[];
  error: string | null;
}> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("routines")
    .select(
      "id, plan_id, version_number, status, published_at, supersedes_routine_id, client_id, name, description, start_date, end_date, days_at_week, effort_metric, is_active, client:profiles!routines_client_id_fkey(first_name, last_name), routine_exercises(count)",
    )
    .order("start_date", { ascending: false });

  if (error) return { routines: [], error: error.message };

  const routines = (data ?? []).map((routine) => {
    const client = routine.client as unknown as ProfileRelation | null;
    const countRelation = routine.routine_exercises as unknown as Array<{
      count: number;
    }>;

    return {
      id: routine.id,
      planId: routine.plan_id,
      versionNumber: routine.version_number,
      status: routine.status as RoutineVersionStatus,
      publishedAt: routine.published_at ?? "",
      supersedesRoutineId: routine.supersedes_routine_id ?? "",
      clientId: routine.client_id,
      clientName: getName(client),
      name: routine.name,
      description: routine.description ?? "",
      startDate: routine.start_date,
      endDate: routine.end_date ?? "",
      daysAtWeek: routine.days_at_week,
      effortMetric: routine.effort_metric as EffortMetric,
      isActive: routine.is_active,
      exerciseCount: countRelation[0]?.count ?? 0,
    } satisfies RoutineListItem;
  });

  return { routines, error: null };
}

export async function getRoutineTemplates(): Promise<{
  templates: RoutineTemplateListItem[];
  error: string | null;
}> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("routine_templates")
    .select(
      "id, name, description, days_at_week, effort_metric, definition, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) return { templates: [], error: error.message };

  return {
    templates: (data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description ?? "",
      daysAtWeek: template.days_at_week,
      effortMetric: template.effort_metric as EffortMetric,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      exerciseCount: Array.isArray(template.definition)
        ? template.definition.length
        : 0,
    })),
    error: null,
  };
}

export async function getRoutineTemplateWorkspace(
  templateId?: string,
): Promise<{
  exercises: ExerciseOption[];
  template: RoutineTemplateDetail | null;
  error: string | null;
}> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const exercisesPromise = supabase
    .from("exercises")
    .select("id, name, video_url")
    .order("name");
  const templatePromise = templateId
    ? supabase
        .from("routine_templates")
        .select(
          "id, name, description, days_at_week, effort_metric, definition, created_at, updated_at",
        )
        .eq("id", templateId)
        .single()
    : Promise.resolve({ data: null, error: null });
  const [exercisesResult, templateResult] = await Promise.all([
    exercisesPromise,
    templatePromise,
  ]);
  const error = exercisesResult.error ?? templateResult.error;
  if (error) return { exercises: [], template: null, error: error.message };

  const exercises = (exercisesResult.data ?? []).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    videoUrl: exercise.video_url ?? "",
  }));
  if (!templateResult.data) return { exercises, template: null, error: null };

  const rawTemplate = templateResult.data;
  const effortMetric = rawTemplate.effort_metric as EffortMetric;
  const templateExercises = parseTemplateDefinition(
    rawTemplate.definition as Json,
    exercises,
    effortMetric,
  );
  if (!templateExercises) {
    return {
      exercises,
      template: null,
      error: "La definición de la plantilla no es válida.",
    };
  }

  return {
    exercises,
    template: {
      id: rawTemplate.id,
      name: rawTemplate.name,
      description: rawTemplate.description ?? "",
      daysAtWeek: rawTemplate.days_at_week,
      effortMetric,
      createdAt: rawTemplate.created_at,
      updatedAt: rawTemplate.updated_at,
      exercises: templateExercises,
    },
    error: null,
  };
}

export async function getRoutineWorkspace(routineId?: string): Promise<{
  clients: RoutineClient[];
  exercises: ExerciseOption[];
  routine: RoutineDetail | null;
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
  const exercisesPromise = supabase
    .from("exercises")
    .select("id, name, video_url")
    .order("name");
  const routinePromise = routineId
    ? supabase
        .from("routines")
        .select(
          "id, plan_id, version_number, status, published_at, supersedes_routine_id, client_id, name, description, start_date, end_date, days_at_week, effort_metric, is_active, client:profiles!routines_client_id_fkey(first_name, last_name), routine_exercises(id, day_number, exercise_id, order_index, technique_notes, exercise:exercises!routine_exercises_exercise_id_fkey(id, name, video_url), routine_exercise_sets(id, set_number, reps, reps_min, reps_max, rest_seconds, weight, target_rir, target_rpe, set_type, tempo, is_optional))",
        )
        .eq("id", routineId)
        .single()
    : Promise.resolve({ data: null, error: null });

  const [clientsResult, exercisesResult, routineResult] = await Promise.all([
    clientsPromise,
    exercisesPromise,
    routinePromise,
  ]);
  const error =
    clientsResult.error ?? exercisesResult.error ?? routineResult.error;

  if (error) {
    return { clients: [], exercises: [], routine: null, error: error.message };
  }

  const clients = (clientsResult.data ?? []).map((item) => {
    const client = item.client as unknown as ProfileRelation | null;
    return {
      id: item.client_id,
      firstName: client?.first_name ?? "",
      lastName: client?.last_name ?? "",
    };
  });
  const exercises = (exercisesResult.data ?? []).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    videoUrl: exercise.video_url ?? "",
  }));

  if (!routineResult.data) {
    return { clients, exercises, routine: null, error: null };
  }

  const rawRoutine = routineResult.data;
  const exerciseIds = [
    ...new Set(
      (
        rawRoutine.routine_exercises as unknown as Array<{
          exercise_id: string;
        }>
      ).map((item) => item.exercise_id),
    ),
  ];
  const notesResult =
    exerciseIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("trainer_client_exercise_notes")
          .select("exercise_id, technical_notes")
          .eq("trainer_id", account.user.id)
          .eq("client_id", rawRoutine.client_id)
          .in("exercise_id", exerciseIds);

  if (notesResult.error) {
    return {
      clients: [],
      exercises: [],
      routine: null,
      error: notesResult.error.message,
    };
  }

  const permanentNotesByExercise = new Map(
    (notesResult.data ?? []).map((note) => [
      note.exercise_id,
      note.technical_notes,
    ]),
  );
  const client = rawRoutine.client as unknown as ProfileRelation | null;
  const rawExercises = rawRoutine.routine_exercises as unknown as Array<{
    id: string;
    day_number: number;
    exercise_id: string;
    order_index: number;
    technique_notes: string | null;
    exercise: { id: string; name: string; video_url: string | null } | null;
    routine_exercise_sets: Array<{
      id: string;
      set_number: number;
      reps: number | null;
      reps_min: number | null;
      reps_max: number | null;
      rest_seconds: number | null;
      weight: number | string | null;
      target_rir: number | null;
      target_rpe: number | null;
      set_type: "warmup" | "ramp_up" | "working" | "drop_set" | "amrap";
      tempo: string | null;
      is_optional: boolean;
    }>;
  }>;
  const routineExercises = rawExercises
    .map((item) => ({
      id: item.id,
      dayNumber: item.day_number,
      exerciseId: item.exercise_id,
      exerciseName: item.exercise?.name ?? "Ejercicio eliminado",
      videoUrl: item.exercise?.video_url ?? "",
      orderIndex: item.order_index,
      techniqueNotes: item.technique_notes ?? "",
      clientExerciseNote: permanentNotesByExercise.get(item.exercise_id) ?? "",
      sets: item.routine_exercise_sets
        .map((set) => ({
          id: set.id,
          setNumber: set.set_number,
          reps: set.reps,
          repsMin: set.reps_min,
          repsMax: set.reps_max,
          restSeconds: set.rest_seconds,
          weight: set.weight === null ? null : Number(set.weight),
          targetRir: set.target_rir,
          targetRpe: set.target_rpe,
          setType: set.set_type,
          tempo: set.tempo ?? "",
          isOptional: set.is_optional,
        }))
        .sort((left, right) => left.setNumber - right.setNumber),
    }))
    .sort(
      (left, right) =>
        left.dayNumber - right.dayNumber || left.orderIndex - right.orderIndex,
    );

  return {
    clients,
    exercises,
    routine: {
      id: rawRoutine.id,
      planId: rawRoutine.plan_id,
      versionNumber: rawRoutine.version_number,
      status: rawRoutine.status as RoutineVersionStatus,
      publishedAt: rawRoutine.published_at ?? "",
      supersedesRoutineId: rawRoutine.supersedes_routine_id ?? "",
      clientId: rawRoutine.client_id,
      clientName: getName(client),
      name: rawRoutine.name,
      description: rawRoutine.description ?? "",
      startDate: rawRoutine.start_date,
      endDate: rawRoutine.end_date ?? "",
      daysAtWeek: rawRoutine.days_at_week,
      effortMetric: rawRoutine.effort_metric as EffortMetric,
      isActive: rawRoutine.is_active,
      exercises: routineExercises,
    },
    error: null,
  };
}

import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { EXERCISES_PAGE_SIZE } from "./pagination";
import type {
  ExerciseCatalogItem,
  ExerciseEditorData,
  ExerciseTaxonomyOption,
  PaginatedExercises,
} from "./types";

type ExerciseRelation = {
  body_zone?: ExerciseTaxonomyOption | ExerciseTaxonomyOption[] | null;
  equipment?: ExerciseTaxonomyOption | ExerciseTaxonomyOption[] | null;
};

type RawExercise = {
  id: string;
  name: string;
  image_url: string | null;
  video_url: string | null;
  exercise_body_zones?: ExerciseRelation[] | null;
  exercise_equipment?: ExerciseRelation[] | null;
};

const exerciseSelection =
  "id, name, image_url, video_url, exercise_body_zones(body_zone:body_zones(id, name)), exercise_equipment(equipment:equipment(id, name))";

export async function getPaginatedExercises(
  requestedPage: number,
  query: string,
): Promise<PaginatedExercises> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const normalizedQuery = query.trim().slice(0, 100);
  const from = (requestedPage - 1) * EXERCISES_PAGE_SIZE;
  const to = from + EXERCISES_PAGE_SIZE - 1;
  let request = supabase
    .from("exercises")
    .select(exerciseSelection, { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (normalizedQuery) request = request.ilike("name", `%${normalizedQuery}%`);

  const { data, error, count } = await request;
  if (error) {
    return {
      exercises: [],
      page: requestedPage,
      pageCount: 1,
      total: 0,
      error: error.message,
    };
  }

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / EXERCISES_PAGE_SIZE));
  return {
    exercises: ((data ?? []) as unknown as RawExercise[]).map(mapExercise),
    page: requestedPage,
    pageCount,
    total,
    error: null,
  };
}

export async function getExerciseEditorData(
  exerciseId?: string,
): Promise<{ data: ExerciseEditorData | null; error: string | null }> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const bodyZonesPromise = supabase
    .from("body_zones")
    .select("id, name")
    .order("name");
  const equipmentPromise = supabase
    .from("equipment")
    .select("id, name")
    .order("name");
  const exercisePromise = exerciseId
    ? supabase
        .from("exercises")
        .select(exerciseSelection)
        .eq("id", exerciseId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [bodyZonesResult, equipmentResult, exerciseResult] = await Promise.all([
    bodyZonesPromise,
    equipmentPromise,
    exercisePromise,
  ]);
  const error =
    bodyZonesResult.error ?? equipmentResult.error ?? exerciseResult.error;
  if (error) return { data: null, error: error.message };
  if (exerciseId && !exerciseResult.data) {
    return {
      data: null,
      error: "El ejercicio no existe o no está disponible.",
    };
  }

  return {
    data: {
      exercise: exerciseResult.data
        ? mapExercise(exerciseResult.data as unknown as RawExercise)
        : null,
      bodyZones: bodyZonesResult.data ?? [],
      equipment: equipmentResult.data ?? [],
    },
    error: null,
  };
}

function mapExercise(exercise: RawExercise): ExerciseCatalogItem {
  return {
    id: exercise.id,
    name: exercise.name,
    imageUrl: exercise.image_url ?? "",
    videoUrl: exercise.video_url ?? "",
    bodyZones: extractRelations(exercise.exercise_body_zones, "body_zone"),
    equipment: extractRelations(exercise.exercise_equipment, "equipment"),
  };
}

function extractRelations(
  relations: ExerciseRelation[] | null | undefined,
  key: "body_zone" | "equipment",
) {
  return (relations ?? []).flatMap((relation) => {
    const value = relation[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
}

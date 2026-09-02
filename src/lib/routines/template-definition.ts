import type { Json } from "@/types/database";
import type { EffortMetric, ExerciseOption, RoutineExercise } from "./types";

type JsonRecord = { [key: string]: Json | undefined };

const isRecord = (value: Json | undefined): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: Json | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asString = (value: Json | undefined) =>
  typeof value === "string" ? value : "";

const setTypes = new Set(["warmup", "ramp_up", "working", "drop_set", "amrap"]);

export function parseTemplateDefinition(
  definition: Json,
  exercises: ExerciseOption[],
  effortMetric: EffortMetric,
): RoutineExercise[] | null {
  if (!Array.isArray(definition) || definition.length === 0) return null;
  const exerciseMap = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );

  const parsed = definition.map((value, exerciseIndex) => {
    if (!isRecord(value)) return null;
    const dayNumber = asNumber(value.day_number);
    const exerciseId = asString(value.exercise_id);
    const rawSets = value.sets;
    if (
      dayNumber === null ||
      !Number.isInteger(dayNumber) ||
      dayNumber < 1 ||
      dayNumber > 7 ||
      !exerciseId ||
      !Array.isArray(rawSets) ||
      rawSets.length === 0
    ) {
      return null;
    }

    const sets = rawSets.map((rawSet, setIndex) => {
      if (!isRecord(rawSet)) return null;
      const rawSetType = asString(rawSet.set_type);
      const setType = setTypes.has(rawSetType) ? rawSetType : "working";
      return {
        id: `template-set-${exerciseIndex}-${setIndex}`,
        setNumber: setIndex + 1,
        reps: null,
        repsMin: asNumber(rawSet.reps_min),
        repsMax: asNumber(rawSet.reps_max),
        restSeconds: asNumber(rawSet.rest_seconds),
        weight: asNumber(rawSet.weight),
        targetRir: effortMetric === "rir" ? asNumber(rawSet.target_rir) : null,
        targetRpe: effortMetric === "rpe" ? asNumber(rawSet.target_rpe) : null,
        setType: setType as RoutineExercise["sets"][number]["setType"],
        tempo: asString(rawSet.tempo),
        isOptional: rawSet.is_optional === true,
      };
    });
    if (sets.some((set) => set === null)) return null;

    const option = exerciseMap.get(exerciseId);
    return {
      id: `template-exercise-${exerciseIndex}`,
      dayNumber,
      exerciseId,
      exerciseName: option?.name ?? "Ejercicio no disponible",
      videoUrl: option?.videoUrl ?? "",
      orderIndex: exerciseIndex,
      techniqueNotes: asString(value.technique_notes),
      clientExerciseNote: "",
      sets: sets as RoutineExercise["sets"],
    };
  });

  return parsed.some((exercise) => exercise === null)
    ? null
    : (parsed as RoutineExercise[]);
}

export function isValidTemplateDefinition(
  definition: Json,
  daysAtWeek: number,
): boolean {
  const parsed = parseTemplateDefinition(definition, [], "rir");
  if (!parsed) return false;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return (
    parsed.every((exercise) => uuidPattern.test(exercise.exerciseId)) &&
    Array.from({ length: daysAtWeek }, (_, index) => index + 1).every((day) =>
      parsed.some((exercise) => exercise.dayNumber === day),
    )
  );
}

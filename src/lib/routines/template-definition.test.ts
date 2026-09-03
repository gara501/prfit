import { describe, expect, it } from "vitest";
import type { Json } from "@/types/database";
import {
  isValidTemplateDefinition,
  parseTemplateDefinition,
} from "./template-definition";

const exerciseId = "7a7f6c5b-9b62-4a77-8b6e-2ea262f75276";
const definition: Json = [
  {
    day_number: 1,
    exercise_id: exerciseId,
    technique_notes: "Controlar la bajada",
    client_exercise_note: "Este dato no pertenece a la plantilla",
    sets: [
      {
        reps_min: "8",
        reps_max: "10",
        rest_seconds: "90",
        weight: "20",
        target_rir: "2",
        target_rpe: "",
        set_type: "working",
        training_method: "eccentric",
        tempo: "3-1-X-0",
        is_optional: false,
      },
    ],
  },
];

describe("routine template definitions", () => {
  it("maps a saved definition into independent editor exercises", () => {
    const parsed = parseTemplateDefinition(
      definition,
      [{ id: exerciseId, name: "Sentadilla", videoUrl: "" }],
      "rir",
    );

    expect(parsed?.[0]).toMatchObject({
      exerciseName: "Sentadilla",
      techniqueNotes: "Controlar la bajada",
      clientExerciseNote: "",
    });
    expect(parsed?.[0]?.sets[0]).toMatchObject({
      repsMin: 8,
      targetRir: 2,
      trainingMethod: "eccentric",
    });
  });

  it("requires an exercise on every configured day", () => {
    expect(isValidTemplateDefinition(definition, 1)).toBe(true);
    expect(isValidTemplateDefinition(definition, 2)).toBe(false);
  });

  it("rejects definitions without sets", () => {
    expect(
      isValidTemplateDefinition(
        [{ day_number: 1, exercise_id: exerciseId, sets: [] }],
        1,
      ),
    ).toBe(false);
  });
});

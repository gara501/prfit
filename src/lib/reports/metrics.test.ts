import { describe, expect, it } from "vitest";
import { calculateProgressMetrics } from "./metrics";

describe("calculateProgressMetrics", () => {
  it("counts only completed sets from completed sessions", () => {
    const result = calculateProgressMetrics(
      [
        { id: "s1", status: "completed", duration_seconds: 3600 },
        { id: "s2", status: "in_progress", duration_seconds: 600 },
      ],
      [
        {
          workout_session_id: "s1",
          exercise_id: "e1",
          executed_exercise_id: null,
          completed: true,
          reps: 10,
          weight: 50,
        },
        {
          workout_session_id: "s1",
          exercise_id: "e1",
          executed_exercise_id: null,
          completed: false,
          reps: 10,
          weight: 50,
        },
        {
          workout_session_id: "s2",
          exercise_id: "e1",
          executed_exercise_id: null,
          completed: true,
          reps: 12,
          weight: 60,
        },
      ],
      new Map([["e1", "Sentadilla"]]),
    );

    expect(result.completedSessions).toBe(1);
    expect(result.completedSets).toBe(1);
    expect(result.totalReps).toBe(10);
    expect(result.volumeKg).toBe(500);
    expect(result.totalDurationSeconds).toBe(3600);
    expect(result.exercises[0]).toMatchObject({
      name: "Sentadilla",
      sessions: 1,
      bestWeightKg: 50,
      bestEstimatedOneRepMaxKg: 66.7,
    });
  });

  it("attributes a substitution to the exercise actually performed", () => {
    const result = calculateProgressMetrics(
      [{ id: "s1", status: "completed", duration_seconds: null }],
      [
        {
          workout_session_id: "s1",
          exercise_id: "planned",
          executed_exercise_id: "performed",
          completed: true,
          reps: 8,
          weight: 20,
        },
      ],
      new Map([["performed", "Remo con mancuerna"]]),
    );
    expect(result.exercises[0].exerciseId).toBe("performed");
    expect(result.exercises[0].name).toBe("Remo con mancuerna");
  });
});

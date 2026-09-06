import type { ProgressExerciseMetric } from "./types";

export type ProgressSessionRow = {
  id: string;
  status: string;
  duration_seconds: number | null;
};

export type ProgressSetRow = {
  workout_session_id: string;
  exercise_id: string;
  executed_exercise_id: string | null;
  completed: boolean;
  reps: number | null;
  weight: number | null;
};

export function calculateProgressMetrics(
  sessions: readonly ProgressSessionRow[],
  sets: readonly ProgressSetRow[],
  exerciseNames: ReadonlyMap<string, string>,
) {
  const completedSessionIds = new Set(
    sessions
      .filter((session) => session.status === "completed")
      .map((session) => session.id),
  );
  const byExercise = new Map<
    string,
    ProgressExerciseMetric & { sessionIds: Set<string> }
  >();
  let completedSets = 0;
  let totalReps = 0;
  let volumeKg = 0;

  for (const set of sets) {
    if (!set.completed || !completedSessionIds.has(set.workout_session_id))
      continue;
    const exerciseId = set.executed_exercise_id ?? set.exercise_id;
    const reps = set.reps ?? 0;
    const weight = set.weight ?? 0;
    const volume = reps * weight;
    const estimatedOneRepMax =
      reps > 0 && weight > 0 ? weight * (1 + reps / 30) : null;
    const current = byExercise.get(exerciseId) ?? {
      exerciseId,
      name: exerciseNames.get(exerciseId) ?? "Ejercicio",
      sessions: 0,
      completedSets: 0,
      totalReps: 0,
      volumeKg: 0,
      bestWeightKg: null,
      bestEstimatedOneRepMaxKg: null,
      sessionIds: new Set<string>(),
    };
    current.completedSets += 1;
    current.totalReps += reps;
    current.volumeKg += volume;
    current.bestWeightKg = Math.max(current.bestWeightKg ?? 0, weight) || null;
    current.bestEstimatedOneRepMaxKg = estimatedOneRepMax
      ? Math.max(current.bestEstimatedOneRepMaxKg ?? 0, estimatedOneRepMax)
      : current.bestEstimatedOneRepMaxKg;
    current.sessionIds.add(set.workout_session_id);
    byExercise.set(exerciseId, current);
    completedSets += 1;
    totalReps += reps;
    volumeKg += volume;
  }

  return {
    completedSessions: completedSessionIds.size,
    completedSets,
    totalReps,
    volumeKg,
    totalDurationSeconds: sessions.reduce(
      (total, session) =>
        total +
        (session.status === "completed" ? (session.duration_seconds ?? 0) : 0),
      0,
    ),
    exercises: [...byExercise.values()]
      .map(({ sessionIds, ...metric }) => ({
        ...metric,
        sessions: sessionIds.size,
        volumeKg: round(metric.volumeKg),
        bestEstimatedOneRepMaxKg:
          metric.bestEstimatedOneRepMaxKg === null
            ? null
            : round(metric.bestEstimatedOneRepMaxKg),
      }))
      .sort((left, right) => right.volumeKg - left.volumeKg),
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

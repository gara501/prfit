import type { ExerciseHistorySession } from "./types";

export function estimateOneRepMax(
  weight: number | null,
  reps: number | null,
): number | null {
  if (weight === null || reps === null || reps <= 0) return null;
  return round(weight * (1 + reps / 30));
}

export function getEstimatedOneRepMaxTrend(sessions: ExerciseHistorySession[]) {
  return sessions.toReversed().flatMap((session) => {
    const estimates = session.sets.flatMap((set) =>
      set.isWarmup || set.estimated1Rm === null ? [] : [set.estimated1Rm],
    );
    const best = estimates.length === 0 ? null : Math.max(...estimates);
    return best === null ? [] : [{ date: session.performedAt, value: best }];
  });
}

export function getLatestSessionComparison(sessions: ExerciseHistorySession[]) {
  const [latest, previous] = sessions;
  if (!latest || !previous) return null;

  const latestMetrics = getSessionMetrics(latest);
  const previousMetrics = getSessionMetrics(previous);
  return {
    latestPerformedAt: latest.performedAt,
    previousPerformedAt: previous.performedAt,
    volumeDelta: latestMetrics.volume - previousMetrics.volume,
    estimated1RmDelta:
      latestMetrics.bestEstimated1Rm === null ||
      previousMetrics.bestEstimated1Rm === null
        ? null
        : round(
            latestMetrics.bestEstimated1Rm - previousMetrics.bestEstimated1Rm,
          ),
  };
}

export function formatTrainingVolume(value: number) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getSessionMetrics(session: ExerciseHistorySession) {
  const estimates = session.sets.flatMap((set) =>
    set.isWarmup || set.estimated1Rm === null ? [] : [set.estimated1Rm],
  );
  return {
    volume: session.sets.reduce((total, set) => total + set.volume, 0),
    bestEstimated1Rm: estimates.length === 0 ? null : Math.max(...estimates),
  };
}

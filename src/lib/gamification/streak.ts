export type ScheduledWorkoutStatus =
  | "scheduled"
  | "completed"
  | "skipped"
  | "rescheduled"
  | "cancelled";

export type ScheduledWorkoutForStreak = {
  scheduledDate: string;
  status: ScheduledWorkoutStatus;
};

export type StreakLevel = {
  id:
    | "impulso"
    | "constancia"
    | "disciplina"
    | "fortaleza"
    | "elite"
    | "leyenda";
  name: string;
  threshold: number;
  imagePath: string;
  description: string;
};

export type GamificationSummary = {
  currentStreak: number;
  bestStreak: number;
  completedTrainingDays: number;
  scheduledTrainingDays: number;
  hasSchedule: boolean;
  pendingToday: boolean;
  currentLevel: StreakLevel | null;
  nextLevel: StreakLevel | null;
  remainingForNextLevel: number;
  nextLevelProgress: number;
};

export const STREAK_LEVELS: readonly StreakLevel[] = [
  {
    id: "impulso",
    name: "Impulso",
    threshold: 3,
    imagePath: "/images/badges/streak-impulso.png",
    description:
      "Los primeros entrenamientos convierten la intención en hábito.",
  },
  {
    id: "constancia",
    name: "Constancia",
    threshold: 7,
    imagePath: "/images/badges/streak-constancia.png",
    description: "Una semana completa de sesiones programadas cumplidas.",
  },
  {
    id: "disciplina",
    name: "Disciplina",
    threshold: 14,
    imagePath: "/images/badges/streak-disciplina.png",
    description:
      "El plan se sostiene incluso cuando depende de la rutina diaria.",
  },
  {
    id: "fortaleza",
    name: "Fortaleza",
    threshold: 30,
    imagePath: "/images/badges/streak-fortaleza.png",
    description: "Treinta jornadas programadas completadas sin una omisión.",
  },
  {
    id: "elite",
    name: "Élite",
    threshold: 60,
    imagePath: "/images/badges/streak-elite.png",
    description:
      "Una adherencia excepcional mantenida durante un ciclo extenso.",
  },
  {
    id: "leyenda",
    name: "Leyenda",
    threshold: 100,
    imagePath: "/images/badges/streak-leyenda.png",
    description:
      "Cien jornadas de entrenamiento programado cumplidas en cadena.",
  },
] as const;

type TrainingDayOutcome = "fulfilled" | "missed" | "pending" | "future";

export function calculateGamificationSummary(
  workouts: readonly ScheduledWorkoutForStreak[],
  today: string,
): GamificationSummary {
  const workoutsByDate = new Map<string, ScheduledWorkoutStatus[]>();

  for (const workout of workouts) {
    if (workout.status === "cancelled" || !isIsoDate(workout.scheduledDate)) {
      continue;
    }
    const statuses = workoutsByDate.get(workout.scheduledDate) ?? [];
    statuses.push(workout.status);
    workoutsByDate.set(workout.scheduledDate, statuses);
  }

  const trainingDays = [...workoutsByDate.entries()]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([date, statuses]) => ({
      date,
      outcome: getTrainingDayOutcome(date, statuses, today),
    }));

  let currentStreak = 0;
  let bestStreak = 0;
  let completedTrainingDays = 0;

  for (const day of trainingDays) {
    if (day.outcome === "fulfilled") {
      currentStreak += 1;
      completedTrainingDays += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (day.outcome === "missed") {
      currentStreak = 0;
    }
  }

  const currentLevel = findCurrentLevel(bestStreak);
  const nextLevel =
    STREAK_LEVELS.find((level) => level.threshold > bestStreak) ?? null;
  const remainingForNextLevel = nextLevel
    ? Math.max(0, nextLevel.threshold - currentStreak)
    : 0;
  const nextLevelProgress = nextLevel
    ? Math.min(100, Math.round((currentStreak / nextLevel.threshold) * 100))
    : 100;

  return {
    currentStreak,
    bestStreak,
    completedTrainingDays,
    scheduledTrainingDays: trainingDays.filter(
      (day) => day.outcome !== "future",
    ).length,
    hasSchedule: trainingDays.length > 0,
    pendingToday: trainingDays.some(
      (day) => day.date === today && day.outcome === "pending",
    ),
    currentLevel,
    nextLevel,
    remainingForNextLevel,
    nextLevelProgress,
  };
}

export function getCalendarDateInTimeZone(
  date = new Date(),
  timeZone = "America/Bogota",
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function getTrainingDayOutcome(
  date: string,
  statuses: readonly ScheduledWorkoutStatus[],
  today: string,
): TrainingDayOutcome {
  if (date > today) return "future";
  if (statuses.every((status) => status === "completed")) return "fulfilled";
  if (statuses.some((status) => status === "skipped")) return "missed";
  if (date < today) return "missed";
  return "pending";
}

function findCurrentLevel(bestStreak: number) {
  return (
    STREAK_LEVELS.findLast((level) => bestStreak >= level.threshold) ?? null
  );
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

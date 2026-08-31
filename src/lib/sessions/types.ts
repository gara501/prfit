export type ClientRoutineOption = {
  id: string;
  name: string;
  description: string;
  daysAtWeek: number | null;
  days: Array<{ dayNumber: number; exerciseCount: number }>;
};

export type WorkoutSessionListItem = {
  id: string;
  routineName: string;
  date: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number | null;
  status: "in_progress" | "completed" | "abandoned";
  dayNumber: number;
  completedSets: number;
  totalSets: number;
};

export type PreviousSetPerformance = {
  reps: number | null;
  weight: number | null;
  performedAt: string;
};

export type LiveWorkoutSet = {
  id: string;
  routineExerciseId: string | null;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  plannedRepsMin: number | null;
  plannedRepsMax: number | null;
  plannedWeight: number | null;
  plannedTargetEffort: number | null;
  setType: "warmup" | "ramp_up" | "working" | "drop_set" | "amrap";
  tempo: string;
  isOptional: boolean;
  actualEffort: number | null;
  clientNotes: string;
  deviationReason: string;
  restSeconds: number | null;
  completed: boolean;
  previousPerformance: PreviousSetPerformance | null;
};

export type LiveWorkoutExercise = {
  blockId: string;
  exerciseId: string;
  name: string;
  videoUrl: string;
  orderIndex: number;
  techniqueNotes: string;
  clientExerciseNote: string;
  sets: LiveWorkoutSet[];
};

export type LiveWorkoutSession = {
  id: string;
  routineName: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number | null;
  status: "in_progress" | "completed" | "abandoned";
  dayNumber: number;
  effortMetric: "rir" | "rpe";
  notes: string;
  exercises: LiveWorkoutExercise[];
  historyUnavailable: boolean;
};

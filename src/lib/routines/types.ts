import type { TrainingMethod } from "./training-methods";

export type RoutineClient = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ExerciseOption = {
  id: string;
  name: string;
  videoUrl: string;
};

export type RoutineVersionStatus = "draft" | "published" | "archived";
export type EffortMetric = "rir" | "rpe";

export type RoutineSet = {
  id: string;
  setNumber: number;
  reps: number | null;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
  weight: number | null;
  targetRir: number | null;
  targetRpe: number | null;
  setType: "warmup" | "ramp_up" | "working" | "drop_set" | "amrap";
  trainingMethod: TrainingMethod;
  tempo: string;
  isOptional: boolean;
};

export type RoutineExercise = {
  id: string;
  dayNumber: number;
  exerciseId: string;
  exerciseName: string;
  videoUrl: string;
  orderIndex: number;
  techniqueNotes: string;
  clientExerciseNote: string;
  sets: RoutineSet[];
};

export type RoutineDetail = {
  id: string;
  planId: string;
  versionNumber: number;
  status: RoutineVersionStatus;
  publishedAt: string;
  supersedesRoutineId: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  daysAtWeek: number | null;
  effortMetric: EffortMetric;
  isActive: boolean;
  exercises: RoutineExercise[];
};

export type RoutineListItem = Omit<RoutineDetail, "exercises"> & {
  exerciseCount: number;
};

export type RoutineTemplateDetail = {
  id: string;
  name: string;
  description: string;
  daysAtWeek: number;
  effortMetric: EffortMetric;
  createdAt: string;
  updatedAt: string;
  exercises: RoutineExercise[];
};

export type RoutineTemplateListItem = Omit<
  RoutineTemplateDetail,
  "exercises"
> & {
  exerciseCount: number;
};

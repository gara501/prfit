export type ExerciseHistoryOverviewItem = {
  exerciseId: string;
  exerciseName: string;
  lastPerformedAt: string;
  sessionCount: number;
  workSetCount: number;
  totalVolume: number;
  maxWeight: number | null;
  maxEstimated1Rm: number | null;
};

export type ExerciseHistorySet = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  actualRir: number | null;
  actualRpe: number | null;
  setType: string;
  isWarmup: boolean;
  volume: number;
  estimated1Rm: number | null;
};

export type ExerciseHistorySession = {
  id: string;
  performedAt: string;
  sets: ExerciseHistorySet[];
};

export type ExerciseRepRangeBest = {
  repRange: string;
  reps: number;
  weight: number | null;
  estimated1Rm: number | null;
  performedAt: string;
};

export type ExerciseHistoryData = {
  overview: ExerciseHistoryOverviewItem[];
  selected: ExerciseHistoryOverviewItem | null;
  sessions: ExerciseHistorySession[];
  repRangeBests: ExerciseRepRangeBest[];
  hasMore: boolean;
  offset: number;
  error: string | null;
};

export type HistoryClientOption = {
  id: string;
  name: string;
};

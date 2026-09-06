export type ExportRole = "admin" | "trainer" | "client";

export type RoutineReportSet = {
  setNumber: number;
  reps: number | null;
  repsMin: number | null;
  repsMax: number | null;
  weight: number | null;
  restSeconds: number | null;
  targetRir: number | null;
  targetRpe: number | null;
  tempo: string;
  setType: string;
  trainingMethod: string;
  optional: boolean;
};

export type RoutineReportExercise = {
  dayNumber: number;
  orderIndex: number;
  name: string;
  techniqueNotes: string;
  clientNotes: string;
  sets: RoutineReportSet[];
};

export type RoutineReportData = {
  id: string;
  clientId: string;
  clientName: string;
  trainerName: string;
  name: string;
  description: string;
  goal: string;
  versionNumber: number;
  status: string;
  startDate: string;
  endDate: string | null;
  daysAtWeek: number | null;
  intensityLevel: number;
  effortMetric: string;
  exercises: RoutineReportExercise[];
};

export type ProgressExerciseMetric = {
  exerciseId: string;
  name: string;
  sessions: number;
  completedSets: number;
  totalReps: number;
  volumeKg: number;
  bestWeightKg: number | null;
  bestEstimatedOneRepMaxKg: number | null;
};

export type ProgressPoint = {
  date: string;
  value: number;
};

export type ProgressReportData = {
  clientId: string;
  clientName: string;
  trainerName: string;
  from: string;
  to: string;
  anonymized: boolean;
  authorizationConfirmed: boolean;
  trainerNotes: string;
  plannedSessions: number;
  completedSessions: number;
  adherencePercent: number | null;
  completedSets: number;
  totalReps: number;
  volumeKg: number;
  totalDurationSeconds: number;
  exercises: ProgressExerciseMetric[];
  weightProgress: ProgressPoint[];
  fatProgress: ProgressPoint[];
  healthStatus: "not_submitted" | "current" | "expired" | "requires_clearance";
};

export type ExportAuditInput = {
  clientId: string;
  exportType: "routine_pdf" | "progress_pdf" | "client_archive";
  routineId?: string;
  periodStart?: string;
  periodEnd?: string;
  anonymized?: boolean;
  result: "completed" | "failed";
  approximateSizeBytes?: number;
};

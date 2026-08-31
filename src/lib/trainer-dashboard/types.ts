export type TrainerClientSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  registerDate: string;
  routineCount: number;
  activeRoutineCount: number;
  activeRoutineId: string;
  activeRoutineName: string;
  sessionCount: number;
  lastSessionAt: string;
  latestWeight: number | null;
  latestFatPercentage: number | null;
  latestMeasurementDate: string;
};

export type ClientRoutineSummary = {
  id: string;
  name: string;
  isActive: boolean;
  status: "draft" | "published" | "archived";
  versionNumber: number;
  startDate: string;
  endDate: string;
};

export type ClientSessionSummary = {
  id: string;
  date: string;
  completedSets: number;
  totalSets: number;
};

export type ClientMeasurementSummary = {
  id: string;
  date: string;
  weight: number | null;
  fatPercentage: number | null;
};

export type TrainerClientDetail = {
  client: TrainerClientSummary;
  routines: ClientRoutineSummary[];
  sessions: ClientSessionSummary[];
  measurements: ClientMeasurementSummary[];
};

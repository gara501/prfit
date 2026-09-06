import type { RoutineClient } from "@/lib/routines/types";

export type PeriodizationStatus = "draft" | "active" | "archived";
export type MesocycleFocus =
  | "base"
  | "hypertrophy"
  | "strength"
  | "power"
  | "peak"
  | "recovery"
  | "custom";
export type MicrocycleLoad = "build" | "deload" | "recovery" | "test";

export type PeriodizationWeek = {
  id: string;
  position: number;
  weekNumber: number;
  objective: string;
  loadType: MicrocycleLoad;
  startDate: string;
  endDate: string;
  volumeLevel: number;
  intensityLevel: number;
  routine: {
    id: string;
    name: string;
    status: "draft" | "published" | "archived";
    versionNumber: number;
  } | null;
};

export type PeriodizationMesocycle = {
  id: string;
  position: number;
  name: string;
  focus: MesocycleFocus;
  objective: string;
  startDate: string;
  endDate: string;
  volumeLevel: number;
  intensityLevel: number;
  weeks: PeriodizationWeek[];
};

export type PeriodizationPlan = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: PeriodizationStatus;
  createdAt: string;
  updatedAt: string;
  mesocycles: PeriodizationMesocycle[];
};

export type PeriodizationListItem = Omit<PeriodizationPlan, "mesocycles"> & {
  mesocycleCount: number;
  weekCount: number;
  routineCount: number;
};

export type PeriodizationWorkspace = {
  clients: RoutineClient[];
  plan: PeriodizationPlan | null;
  error: string | null;
};

export type MicrocycleRoutineContext = {
  microcycleId: string;
  clientId: string;
  planId: string;
  planName: string;
  mesocycleName: string;
  weekNumber: number;
  intensityLevel: number;
  startDate: string;
  endDate: string;
};

export const mesocycleFocusLabels: Record<MesocycleFocus, string> = {
  base: "Base",
  hypertrophy: "Hipertrofia",
  strength: "Fuerza",
  power: "Potencia",
  peak: "Puesta a punto",
  recovery: "Recuperación",
  custom: "Otro enfoque",
};

export const microcycleLoadLabels: Record<MicrocycleLoad, string> = {
  build: "Carga",
  deload: "Descarga",
  recovery: "Recuperación",
  test: "Evaluación",
};

export const periodizationStatusLabels: Record<PeriodizationStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

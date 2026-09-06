import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type {
  MesocycleFocus,
  MicrocycleLoad,
  MicrocycleRoutineContext,
  PeriodizationListItem,
  PeriodizationPlan,
  PeriodizationStatus,
  PeriodizationWorkspace,
} from "./types";

type ProfileRelation = { first_name: string | null; last_name: string | null };
type RoutineRelation = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  version_number: number;
};
type RawWeek = {
  id: string;
  position: number;
  week_number: number;
  objective: string | null;
  load_type: string;
  start_date: string;
  end_date: string;
  volume_level: number;
  intensity_level: number;
  routines: RoutineRelation[] | null;
};
type RawMesocycle = {
  id: string;
  position: number;
  name: string;
  focus: string;
  objective: string | null;
  start_date: string;
  end_date: string;
  volume_level: number;
  intensity_level: number;
  training_microcycles: RawWeek[] | null;
};
type RawPlan = {
  id: string;
  client_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  client: ProfileRelation | null;
  training_mesocycles: RawMesocycle[] | null;
};

const getName = (profile: ProfileRelation | null | undefined) =>
  `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
  "Cliente sin nombre";

const planSelect =
  "id, client_id, name, goal, start_date, end_date, status, created_at, updated_at, client:profiles!training_plans_client_id_fkey(first_name, last_name), training_mesocycles(id, position, name, focus, objective, start_date, end_date, volume_level, intensity_level, training_microcycles(id, position, week_number, objective, load_type, start_date, end_date, volume_level, intensity_level, routines(id, name, status, version_number)))";

function mapPlan(raw: RawPlan): PeriodizationPlan {
  return {
    id: raw.id,
    clientId: raw.client_id,
    clientName: getName(raw.client),
    name: raw.name,
    goal: raw.goal ?? "",
    startDate: raw.start_date,
    endDate: raw.end_date,
    status: raw.status as PeriodizationStatus,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    mesocycles: (raw.training_mesocycles ?? [])
      .map((mesocycle) => ({
        id: mesocycle.id,
        position: mesocycle.position,
        name: mesocycle.name,
        focus: mesocycle.focus as MesocycleFocus,
        objective: mesocycle.objective ?? "",
        startDate: mesocycle.start_date,
        endDate: mesocycle.end_date,
        volumeLevel: mesocycle.volume_level,
        intensityLevel: mesocycle.intensity_level,
        weeks: (mesocycle.training_microcycles ?? [])
          .map((week) => {
            const preferredRoutine = [...(week.routines ?? [])].sort(
              (left, right) =>
                (left.status === "draft" ? 0 : 1) -
                  (right.status === "draft" ? 0 : 1) ||
                right.version_number - left.version_number,
            )[0];
            return {
              id: week.id,
              position: week.position,
              weekNumber: week.week_number,
              objective: week.objective ?? "",
              loadType: week.load_type as MicrocycleLoad,
              startDate: week.start_date,
              endDate: week.end_date,
              volumeLevel: week.volume_level,
              intensityLevel: week.intensity_level,
              routine: preferredRoutine
                ? {
                    id: preferredRoutine.id,
                    name: preferredRoutine.name,
                    status: preferredRoutine.status,
                    versionNumber: preferredRoutine.version_number,
                  }
                : null,
            };
          })
          .sort((left, right) => left.position - right.position),
      }))
      .sort((left, right) => left.position - right.position),
  };
}

export async function getPeriodizationPlans(): Promise<{
  plans: PeriodizationListItem[];
  error: string | null;
}> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("training_plans")
    .select(planSelect)
    .order("start_date", { ascending: false });
  if (error) return { plans: [], error: error.message };

  return {
    plans: ((data ?? []) as unknown as RawPlan[]).map((raw) => {
      const plan = mapPlan(raw);
      const weeks = plan.mesocycles.flatMap((item) => item.weeks);
      return {
        ...plan,
        mesocycleCount: plan.mesocycles.length,
        weekCount: weeks.length,
        routineCount: weeks.filter((week) => week.routine).length,
      };
    }),
    error: null,
  };
}

export async function getPeriodizationWorkspace(
  planId?: string,
): Promise<PeriodizationWorkspace> {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const clientsPromise = supabase
    .from("trainer_clients")
    .select(
      "client_id, client:profiles!trainer_clients_client_id_fkey(first_name, last_name)",
    )
    .eq("trainer_id", account.user.id)
    .eq("is_active", true);
  const planPromise = planId
    ? supabase
        .from("training_plans")
        .select(planSelect)
        .eq("id", planId)
        .single()
    : Promise.resolve({ data: null, error: null });
  const [clientsResult, planResult] = await Promise.all([
    clientsPromise,
    planPromise,
  ]);
  const error = clientsResult.error ?? planResult.error;
  if (error) return { clients: [], plan: null, error: error.message };

  return {
    clients: (clientsResult.data ?? []).map((item) => {
      const client = item.client as unknown as ProfileRelation | null;
      return {
        id: item.client_id,
        firstName: client?.first_name ?? "",
        lastName: client?.last_name ?? "",
      };
    }),
    plan: planResult.data
      ? mapPlan(planResult.data as unknown as RawPlan)
      : null,
    error: null,
  };
}

export async function getMicrocycleRoutineContext(
  microcycleId: string,
): Promise<MicrocycleRoutineContext | null> {
  await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("training_microcycles")
    .select(
      "id, week_number, start_date, end_date, intensity_level, training_plan:training_plans!training_microcycles_training_plan_id_fkey(id, client_id, name), mesocycle:training_mesocycles!training_microcycles_mesocycle_id_training_plan_id_fkey(name)",
    )
    .eq("id", microcycleId)
    .maybeSingle();
  if (error || !data) return null;

  const plan = data.training_plan as unknown as {
    id: string;
    client_id: string;
    name: string;
  } | null;
  const mesocycle = data.mesocycle as unknown as { name: string } | null;
  if (!plan || !mesocycle) return null;
  return {
    microcycleId: data.id,
    clientId: plan.client_id,
    planId: plan.id,
    planName: plan.name,
    mesocycleName: mesocycle.name,
    weekNumber: data.week_number,
    intensityLevel: data.intensity_level,
    startDate: data.start_date,
    endDate: data.end_date,
  };
}

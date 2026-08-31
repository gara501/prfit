import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  ExerciseHistoryData,
  ExerciseHistoryOverviewItem,
  ExerciseHistorySession,
  HistoryClientOption,
} from "./types";

const pageSize = 12;
type OverviewRpcRow =
  Database["public"]["Functions"]["list_exercise_history_overview"]["Returns"][number];
type HistoryPageRpcRow =
  Database["public"]["Functions"]["list_exercise_history_page"]["Returns"][number];
type RepRangeBestRpcRow =
  Database["public"]["Functions"]["list_exercise_rep_range_bests"]["Returns"][number];

export async function getClientExerciseHistory(
  selectedExerciseId?: string,
  requestedOffset?: number,
): Promise<ExerciseHistoryData> {
  const account = await requireRole("client");
  const supabase = createClient(await cookies());
  return getExerciseHistoryData(
    supabase,
    account.user.id,
    selectedExerciseId,
    requestedOffset,
  );
}

export async function getTrainerExerciseHistory(
  selectedClientId?: string,
  selectedExerciseId?: string,
  requestedOffset?: number,
): Promise<{
  clients: HistoryClientOption[];
  selectedClient: HistoryClientOption | null;
  history: ExerciseHistoryData;
}> {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("trainer_clients")
    .select(
      "client_id, client:profiles!trainer_clients_client_id_fkey(first_name, last_name)",
    )
    .eq("trainer_id", account.user.id)
    .eq("is_active", true);

  if (error) {
    return {
      clients: [],
      selectedClient: null,
      history: emptyHistory(error.message),
    };
  }

  const clients = (data ?? [])
    .map((assignment) => {
      const client = assignment.client as unknown as {
        first_name: string | null;
        last_name: string | null;
      } | null;
      const name =
        `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim();
      return { id: assignment.client_id, name: name || "Cliente" };
    })
    .toSorted((left, right) => left.name.localeCompare(right.name, "es"));
  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ??
    clients[0] ??
    null;

  return {
    clients,
    selectedClient,
    history: selectedClient
      ? await getExerciseHistoryData(
          supabase,
          selectedClient.id,
          selectedExerciseId,
          requestedOffset,
        )
      : emptyHistory(null),
  };
}

async function getExerciseHistoryData(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  selectedExerciseId?: string,
  requestedOffset?: number,
): Promise<ExerciseHistoryData> {
  const offset = Math.max(
    0,
    typeof requestedOffset === "number" && Number.isFinite(requestedOffset)
      ? Math.floor(requestedOffset)
      : 0,
  );
  const { data: overviewData, error: overviewError } = await supabase.rpc(
    "list_exercise_history_overview",
    { p_client_id: clientId },
  );
  if (overviewError) return emptyHistory(overviewError.message, offset);

  const overview = (overviewData ?? []).map((item: OverviewRpcRow) =>
    toOverviewItem(item),
  );
  const selected =
    overview.find(
      (exercise: ExerciseHistoryOverviewItem) =>
        exercise.exerciseId === selectedExerciseId,
    ) ??
    overview[0] ??
    null;
  if (!selected) return { ...emptyHistory(null, offset), overview };

  const [pageResult, bestsResult] = await Promise.all([
    supabase.rpc("list_exercise_history_page", {
      p_client_id: clientId,
      p_exercise_id: selected.exerciseId,
      p_limit: pageSize + 1,
      p_offset: offset,
    }),
    supabase.rpc("list_exercise_rep_range_bests", {
      p_client_id: clientId,
      p_exercise_id: selected.exerciseId,
    }),
  ]);
  const error = pageResult.error ?? bestsResult.error;
  if (error)
    return { ...emptyHistory(error.message, offset), overview, selected };

  const allSessions = groupHistorySessions(
    (pageResult.data ?? []) as HistoryPageRpcRow[],
  );
  return {
    overview,
    selected,
    sessions: allSessions.slice(0, pageSize),
    repRangeBests: (bestsResult.data ?? []).map((best: RepRangeBestRpcRow) => ({
      repRange: best.rep_range,
      reps: best.reps,
      weight: numberOrNull(best.weight),
      estimated1Rm: numberOrNull(best.estimated_1rm),
      performedAt: best.performed_at,
    })),
    hasMore: allSessions.length > pageSize,
    offset,
    error: null,
  };
}

function toOverviewItem(item: OverviewRpcRow): ExerciseHistoryOverviewItem {
  return {
    exerciseId: item.exercise_id,
    exerciseName: item.exercise_name,
    lastPerformedAt: item.last_performed_at,
    sessionCount: Number(item.session_count),
    workSetCount: Number(item.work_set_count),
    totalVolume: Number(item.total_volume),
    maxWeight: numberOrNull(item.max_weight),
    maxEstimated1Rm: numberOrNull(item.max_estimated_1rm),
  };
}

function groupHistorySessions(
  rows: HistoryPageRpcRow[],
): ExerciseHistorySession[] {
  const sessions = new Map<string, ExerciseHistorySession>();
  for (const row of rows) {
    const session = sessions.get(row.session_id) ?? {
      id: row.session_id,
      performedAt: row.performed_at,
      sets: [],
    };
    session.sets.push({
      id: row.set_id,
      setNumber: row.set_number,
      reps: numberOrNull(row.reps),
      weight: numberOrNull(row.weight),
      actualRir: numberOrNull(row.actual_rir),
      actualRpe: numberOrNull(row.actual_rpe),
      setType: row.set_type,
      isWarmup: row.is_warmup,
      volume: Number(row.volume),
      estimated1Rm: numberOrNull(row.estimated_1rm),
    });
    sessions.set(row.session_id, session);
  }
  return [...sessions.values()];
}

function emptyHistory(error: string | null, offset = 0): ExerciseHistoryData {
  return {
    overview: [],
    selected: null,
    sessions: [],
    repRangeBests: [],
    hasMore: false,
    offset,
    error,
  };
}

function numberOrNull(value: number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type {
  ClientMeasurementSummary,
  ClientRoutineSummary,
  ClientSessionSummary,
  TrainerClientDetail,
  TrainerClientSummary,
} from "./types";

type ClientProfileRelation = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  register_date: string;
};

export async function getTrainerDashboard(selectedClientId?: string): Promise<{
  clients: TrainerClientSummary[];
  selected: TrainerClientDetail | null;
  error: string | null;
}> {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const assignmentsPromise = supabase
    .from("trainer_clients")
    .select(
      "client_id, client:profiles!trainer_clients_client_id_fkey(id, first_name, last_name, email, phone, birth_date, register_date)",
    )
    .eq("trainer_id", account.user.id)
    .eq("is_active", true);
  const routinesPromise = supabase
    .from("routines")
    .select(
      "id, client_id, name, is_active, status, version_number, start_date, end_date",
    )
    .order("start_date", { ascending: false });
  const sessionsPromise = supabase
    .from("workout_sessions")
    .select("id, client_id, date, workout_session_sets(completed)")
    .order("date", { ascending: false });
  const measurementsPromise = supabase
    .from("body_compositions")
    .select("id, client_id, date, weight, fat_percentage")
    .order("date", { ascending: false });
  const [
    assignmentsResult,
    routinesResult,
    sessionsResult,
    measurementsResult,
  ] = await Promise.all([
    assignmentsPromise,
    routinesPromise,
    sessionsPromise,
    measurementsPromise,
  ]);
  const error =
    assignmentsResult.error ??
    routinesResult.error ??
    sessionsResult.error ??
    measurementsResult.error;
  if (error) return { clients: [], selected: null, error: error.message };

  const routinesByClient = groupBy(
    routinesResult.data ?? [],
    (row) => row.client_id,
  );
  const sessionsByClient = groupBy(
    sessionsResult.data ?? [],
    (row) => row.client_id,
  );
  const measurementsByClient = groupBy(
    measurementsResult.data ?? [],
    (row) => row.client_id,
  );
  const today = new Date().toISOString().slice(0, 10);

  const clients = (assignmentsResult.data ?? [])
    .map((assignment) => {
      const profile =
        assignment.client as unknown as ClientProfileRelation | null;
      if (!profile) return null;
      const routines = routinesByClient.get(profile.id) ?? [];
      const sessions = sessionsByClient.get(profile.id) ?? [];
      const measurements = measurementsByClient.get(profile.id) ?? [];
      const latestMeasurement = measurements[0];
      const activeRoutine = routines.find(
        (routine) =>
          routine.status === "published" &&
          routine.is_active &&
          routine.start_date <= today &&
          (!routine.end_date || routine.end_date >= today),
      );
      return {
        id: profile.id,
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        birthDate: profile.birth_date ?? "",
        registerDate: profile.register_date,
        routineCount: routines.length,
        activeRoutineCount: routines.filter(
          (routine) => routine.status === "published" && routine.is_active,
        ).length,
        activeRoutineId: activeRoutine?.id ?? "",
        activeRoutineName: activeRoutine?.name ?? "",
        sessionCount: sessions.length,
        lastSessionAt: sessions[0]?.date ?? "",
        latestWeight:
          latestMeasurement?.weight === null ||
          latestMeasurement?.weight === undefined
            ? null
            : Number(latestMeasurement.weight),
        latestFatPercentage:
          latestMeasurement?.fat_percentage === null ||
          latestMeasurement?.fat_percentage === undefined
            ? null
            : Number(latestMeasurement.fat_percentage),
        latestMeasurementDate: latestMeasurement?.date ?? "",
      } satisfies TrainerClientSummary;
    })
    .filter((client): client is TrainerClientSummary => client !== null)
    .toSorted((left, right) =>
      `${left.firstName} ${left.lastName}`.localeCompare(
        `${right.firstName} ${right.lastName}`,
        "es",
      ),
    );

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ??
    clients[0] ??
    null;
  if (!selectedClient) return { clients, selected: null, error: null };

  const selectedRoutines: ClientRoutineSummary[] = (
    routinesByClient.get(selectedClient.id) ?? []
  ).map((routine) => ({
    id: routine.id,
    name: routine.name,
    isActive: routine.is_active,
    status: routine.status as ClientRoutineSummary["status"],
    versionNumber: routine.version_number,
    startDate: routine.start_date,
    endDate: routine.end_date ?? "",
  }));
  const selectedSessions: ClientSessionSummary[] = (
    sessionsByClient.get(selectedClient.id) ?? []
  )
    .slice(0, 8)
    .map((session) => {
      const sets = session.workout_session_sets as unknown as Array<{
        completed: boolean;
      }>;
      return {
        id: session.id,
        date: session.date,
        completedSets: sets.filter((set) => set.completed).length,
        totalSets: sets.length,
      };
    });
  const selectedMeasurements: ClientMeasurementSummary[] = (
    measurementsByClient.get(selectedClient.id) ?? []
  )
    .slice(0, 8)
    .map((measurement) => ({
      id: measurement.id,
      date: measurement.date,
      weight: measurement.weight === null ? null : Number(measurement.weight),
      fatPercentage:
        measurement.fat_percentage === null
          ? null
          : Number(measurement.fat_percentage),
    }));

  return {
    clients,
    selected: {
      client: selectedClient,
      routines: selectedRoutines,
      sessions: selectedSessions,
      measurements: selectedMeasurements,
    },
    error: null,
  };
}

function groupBy<T>(
  values: T[],
  getKey: (value: T) => string,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const value of values) {
    const key = getKey(value);
    const group = result.get(key);
    if (group) group.push(value);
    else result.set(key, [value]);
  }
  return result;
}

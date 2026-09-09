import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { readAll } from "@/lib/supabase/read-all";
import { createClient } from "@/lib/supabase/server";
import type { TrainerClientDetail, TrainerClientSummary } from "./types";

export async function getTrainerDashboard(selectedClientId?: string): Promise<{
  clients: TrainerClientSummary[];
  selected: TrainerClientDetail | null;
  error: string | null;
}> {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  try {
    // Avoid calling the summary RPC when this trainer has no assignments. Besides
    // being cheaper, this keeps the empty dashboard available while a database
    // deployment is catching up with the application version.
    const assignments = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", account.user.id)
      .eq("is_active", true)
      .limit(1);

    if (assignments.error) throw new Error("assignments");
    if (!assignments.data?.length) {
      return { clients: [], selected: null, error: null };
    }

    const result = await readAll(supabase.rpc("list_trainer_client_summaries"));
    const clients = result.data as unknown as TrainerClientSummary[];
    const client = clients.find((c) => c.id === selectedClientId) ?? clients[0];
    if (!client) return { clients, selected: null, error: null };
    const [routines, sessions, measurements, context] = await Promise.all([
      readAll(
        supabase
          .from("routines")
          .select("id,name,is_active,status,version_number,start_date,end_date")
          .eq("client_id", client.id)
          .order("start_date", { ascending: false })
          .order("id"),
      ),
      supabase
        .from("workout_sessions")
        .select("id,date,workout_session_sets(completed)")
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .order("id")
        .limit(8),
      supabase
        .from("body_compositions")
        .select("id,date,weight,fat_percentage")
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .order("id")
        .limit(8),
      supabase
        .from("trainer_client_private_contexts")
        .select("goals,restrictions,private_notes")
        .eq("client_id", client.id)
        .maybeSingle(),
    ]);
    if (sessions.error || measurements.error || context.error)
      throw new Error("query");
    return {
      clients,
      error: null,
      selected: {
        client,
        routines: routines.data.map((r) => ({
          id: r.id,
          name: r.name,
          isActive: r.is_active,
          status: r.status as "draft" | "published" | "archived",
          versionNumber: r.version_number,
          startDate: r.start_date,
          endDate: r.end_date ?? "",
        })),
        sessions: (sessions.data ?? []).map((s) => ({
          id: s.id,
          date: s.date,
          completedSets: s.workout_session_sets.filter((s) => s.completed)
            .length,
          totalSets: s.workout_session_sets.length,
        })),
        measurements: (measurements.data ?? []).map((m) => ({
          id: m.id,
          date: m.date,
          weight: m.weight,
          fatPercentage: m.fat_percentage,
        })),
        context: {
          goals: context.data?.goals ?? "",
          restrictions: context.data?.restrictions ?? "",
          privateNotes: context.data?.private_notes ?? "",
        },
      },
    };
  } catch {
    return {
      clients: [],
      selected: null,
      error: "No fue posible cargar el dashboard. Intenta nuevamente.",
    };
  }
}

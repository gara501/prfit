import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuthenticatedAccount } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ClientAssignment = {
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  assignmentId: string | null;
  trainerId: string | null;
  trainerFirstName: string;
  trainerLastName: string;
  startDate: string | null;
  activeRoutineId: string | null;
  activeRoutineName: string;
};

export type TrainerOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type RawClientAssignment = {
  client_id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  assignment_id: string | null;
  trainer_id: string | null;
  trainer_first_name: string | null;
  trainer_last_name: string | null;
  start_date: string | null;
  active_routine_id: string | null;
  active_routine_name: string | null;
};

type AssignmentManagementData = {
  role: Extract<AppRole, "admin" | "trainer">;
  currentUserId: string;
  assignments: ClientAssignment[];
  trainers: TrainerOption[];
  error: string | null;
};

export async function getAssignmentManagementData(): Promise<AssignmentManagementData> {
  const account = await requireAuthenticatedAccount();

  if (account.role === "client") {
    redirect("/client");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const assignmentsPromise = createAdminClient().rpc("list_client_assignments");
  const trainersPromise =
    account.role === "admin"
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("role", "trainer")
          .eq("is_active", true)
          .order("first_name")
      : Promise.resolve({
          data: [
            {
              id: account.user.id,
              first_name: account.firstName,
              last_name: account.lastName,
            },
          ],
          error: null,
        });

  const [assignmentsResult, trainersResult] = await Promise.all([
    assignmentsPromise,
    trainersPromise,
  ]);

  if (assignmentsResult.error || trainersResult.error) {
    return {
      role: account.role,
      currentUserId: account.user.id,
      assignments: [],
      trainers: [],
      error:
        assignmentsResult.error?.message ??
        trainersResult.error?.message ??
        "No fue posible cargar las asignaciones.",
    };
  }

  const assignments = ((assignmentsResult.data ?? []) as RawClientAssignment[])
    .filter(
      (assignment) =>
        account.role === "admin" ||
        assignment.trainer_id === null ||
        assignment.trainer_id === account.user.id,
    )
    .map((assignment) => {
      const canSeeClientDetails =
        account.role === "admin" || assignment.trainer_id === account.user.id;

      return {
        clientId: assignment.client_id,
        clientFirstName: assignment.client_first_name ?? "",
        clientLastName: assignment.client_last_name ?? "",
        clientEmail: canSeeClientDetails ? (assignment.client_email ?? "") : "",
        clientPhone: canSeeClientDetails ? (assignment.client_phone ?? "") : "",
        assignmentId: assignment.assignment_id ?? null,
        trainerId: assignment.trainer_id ?? null,
        trainerFirstName: assignment.trainer_first_name ?? "",
        trainerLastName: assignment.trainer_last_name ?? "",
        startDate: assignment.start_date ?? null,
        activeRoutineId: canSeeClientDetails
          ? (assignment.active_routine_id ?? null)
          : null,
        activeRoutineName: canSeeClientDetails
          ? (assignment.active_routine_name ?? "")
          : "",
      };
    });

  const trainers = (trainersResult.data ?? []).map((trainer) => ({
    id: trainer.id,
    firstName: trainer.first_name ?? "",
    lastName: trainer.last_name ?? "",
  }));

  return {
    role: account.role,
    currentUserId: account.user.id,
    assignments,
    trainers,
    error: null,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedAccount } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type AssignmentFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function assignClient(
  _previousState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const account = await requireAuthenticatedAccount();

  if (account.role === "client") {
    return {
      status: "error",
      message: "No tienes permiso para gestionar asignaciones.",
    };
  }

  const clientId = formData.get("clientId");
  const selectedTrainerId = formData.get("trainerId");
  const trainerId =
    account.role === "trainer" ? account.user.id : selectedTrainerId;

  if (
    typeof clientId !== "string" ||
    typeof trainerId !== "string" ||
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(trainerId)
  ) {
    return {
      status: "error",
      message: "Selecciona un cliente y un entrenador válidos.",
    };
  }

  const { error } = await createAdminClient().rpc("assign_client_to_trainer", {
    p_client_id: clientId,
    p_trainer_id: trainerId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin/assignments");
  revalidatePath("/trainer/clients");

  return {
    status: "success",
    message: "La asignación quedó activa correctamente.",
  };
}

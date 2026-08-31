"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthRedirectUrl } from "@/lib/supabase/config";

export type CreateTrainerClientState = {
  status: "idle" | "success" | "error";
  message: string;
  clientId: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+0-9().\s-]{7,30}$/;
const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};

function authErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();
  if (
    error.code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already exists")
  ) {
    return "Ya existe una cuenta con este correo electrónico.";
  }
  if (error.code === "weak_password" || message.includes("password")) {
    return "La contraseña temporal no cumple los requisitos de seguridad.";
  }
  return error.message;
}

export async function createTrainerClient(
  _state: CreateTrainerClientState,
  formData: FormData,
): Promise<CreateTrainerClientState> {
  const trainer = await requireRole("trainer");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const birthDate = text(formData, "birthDate");

  if (
    !firstName ||
    !lastName ||
    !emailPattern.test(email) ||
    (phone && !phonePattern.test(phone)) ||
    (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate))
  ) {
    return {
      status: "error",
      message: "Completa los datos con un correo válido.",
      clientId: "",
    };
  }

  const admin = createAdminClient();
  const { data, error: createError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { phone },
      redirectTo: getAuthRedirectUrl("/auth/confirm?next=/auth/setup-password"),
    },
  );
  if (createError) {
    return {
      status: "error",
      message: authErrorMessage(createError),
      clientId: "",
    };
  }

  if (!data.user) {
    return {
      status: "error",
      message: "No fue posible crear la invitación. Intenta nuevamente.",
      clientId: "",
    };
  }

  const clientId = data.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      birth_date: birthDate || null,
      role: "client",
      must_change_password: true,
    })
    .eq("id", clientId);
  if (profileError) {
    await admin.auth.admin.deleteUser(clientId);
    return {
      status: "error",
      message: "No fue posible completar el perfil; la cuenta no fue creada.",
      clientId: "",
    };
  }

  const { error: assignmentError } = await admin.rpc(
    "assign_client_to_trainer",
    {
      p_client_id: clientId,
      p_trainer_id: trainer.user.id,
    },
  );
  if (assignmentError) {
    await admin.auth.admin.deleteUser(clientId);
    return {
      status: "error",
      message:
        "No fue posible vincular el cliente; la cuenta se revirtió. " +
        assignmentError.message,
      clientId: "",
    };
  }

  revalidatePath("/trainer");
  revalidatePath("/trainer/clients");
  revalidatePath("/trainer/routines/new");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/assignments");
  return {
    status: "success",
    message: `La invitación para ${firstName} fue enviada y quedó vinculada a tu cartera.`,
    clientId,
  };
}

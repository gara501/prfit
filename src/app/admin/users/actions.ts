"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthRedirectUrl } from "@/lib/supabase/config";

export type CreateUserFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type DeactivateUserFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const validRoles = new Set(["trainer", "client"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+0-9().\s-]{7,30}$/;

const getTextField = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};

function getCreateUserError(error: AuthError) {
  const normalizedMessage = error.message.toLowerCase();

  if (
    error.code === "email_exists" ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("already exists")
  ) {
    return "Ya existe una cuenta registrada con este correo electrónico.";
  }

  if (
    error.code === "weak_password" ||
    normalizedMessage.includes("password")
  ) {
    return "La contraseña no cumple los requisitos de seguridad de Supabase.";
  }

  return `No se pudo crear la cuenta. ${error.message}`;
}

export async function createUser(
  _previousState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  await requireAdmin();

  const email = getTextField(formData, "email").toLowerCase();
  const role = getTextField(formData, "role");
  const firstName = getTextField(formData, "firstName");
  const lastName = getTextField(formData, "lastName");
  const phone = getTextField(formData, "phone");

  if (!firstName || !lastName || !email || !validRoles.has(role)) {
    return {
      status: "error",
      message: "Completa todos los campos con valores válidos.",
    };
  }

  if (!emailPattern.test(email)) {
    return {
      status: "error",
      message: "Escribe un correo electrónico válido.",
    };
  }

  if (phone && !phonePattern.test(phone)) {
    return {
      status: "error",
      message: "Escribe un teléfono válido o déjalo vacío.",
    };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { phone },
        redirectTo: getAuthRedirectUrl(
          "/auth/confirm?next=/auth/setup-password",
        ),
      },
    );

    if (error) {
      return { status: "error", message: getCreateUserError(error) };
    }

    if (!data.user) {
      return {
        status: "error",
        message: "No fue posible crear la invitación. Intenta nuevamente.",
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        role: role as "trainer" | "client",
        must_change_password: true,
      })
      .eq("id", data.user.id);

    if (updateError) {
      const { error: rollbackError } =
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      return {
        status: "error",
        message: rollbackError
          ? "No fue posible completar el perfil y la cuenta requiere revisión manual."
          : "No fue posible completar el perfil; la cuenta se revirtió.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/trainers");
    revalidatePath("/admin/assignments");
    revalidatePath("/trainer/clients");

    return {
      status: "success",
      message: `La invitación para ${firstName} se envió correctamente.`,
    };
  } catch {
    return {
      status: "error",
      message:
        "Ocurrió un error inesperado al crear la cuenta. Intenta nuevamente.",
    };
  }
}

export async function deactivateUser(
  _previousState: DeactivateUserFormState,
  formData: FormData,
): Promise<DeactivateUserFormState> {
  const currentUser = await requireAdmin();
  const userId = getTextField(formData, "userId");
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    return {
      status: "error",
      message: "El usuario seleccionado no es válido.",
    };
  }

  if (userId === currentUser.id) {
    return {
      status: "error",
      message: "No puedes desactivar tu propia cuenta.",
    };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.rpc("deactivate_user_profile", {
      p_user_id: userId,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: "876000h" },
    );

    if (banError) {
      return {
        status: "error",
        message:
          "El perfil fue desactivado y su acceso a datos fue bloqueado, pero no se pudo revocar el inicio de sesión. Intenta nuevamente.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/trainers");
    revalidatePath("/admin/assignments");
    revalidatePath("/trainer/clients");

    return {
      status: "success",
      message:
        data === false
          ? "La cuenta ya estaba inactiva."
          : "La cuenta se desactivó correctamente.",
    };
  } catch {
    return {
      status: "error",
      message: "No fue posible desactivar la cuenta. Intenta nuevamente.",
    };
  }
}

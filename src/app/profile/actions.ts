// src/app/profile/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { status: "error", message: "Tu sesión no está disponible." };

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const birthDate = formData.get("birthDate") as string;
  const phone = (formData.get("phone") as string).trim();

  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    return {
      status: "error",
      message: "Ingresa nombre y apellido de al menos 2 caracteres.",
    };
  }
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      birth_date: birthDate || null,
    })
    .eq("id", user.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/profile");
  revalidatePath("/trainer");
  revalidatePath("/trainer/clients");
  return {
    status: "success",
    message: "Tus datos se guardaron correctamente.",
  };
}

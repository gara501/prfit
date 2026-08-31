"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const destinations = {
  admin: "/admin",
  trainer: "/trainer",
  client: "/client",
} as const;

function getPasswordReturnPath(value: FormDataEntryValue | null) {
  return value === "/auth/reset-password"
    ? "/auth/reset-password"
    : "/auth/setup-password";
}

export async function savePassword(formData: FormData) {
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  const returnTo = getPasswordReturnPath(formData.get("returnTo"));

  if (
    typeof password !== "string" ||
    typeof confirmation !== "string" ||
    password.length < 8 ||
    password !== confirmation
  ) {
    redirect(
      `${returnTo}?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres y coincidir con su confirmación.")}`,
    );
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?error=El enlace ya no es válido. Solicita uno nuevo.");
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    redirect(`${returnTo}?error=${encodeURIComponent(passwordError.message)}`);
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id)
    .select("role, is_active")
    .single();

  if (profileError || !profile || profile.is_active !== true) {
    await supabase.auth.signOut({ scope: "local" });
    redirect(
      "/login?error=No fue posible completar la configuración de tu cuenta.",
    );
  }

  const destination = destinations[profile.role as keyof typeof destinations];
  redirect(destination ?? "/login");
}

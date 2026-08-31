// src/app/(auth)/login/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthRedirectUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Ya autenticado, ahora consultamos su rol para redirigir bien
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.is_active !== true) {
    await supabase.auth.signOut({ scope: "local" });
    redirect(
      `/login?error=${encodeURIComponent("Tu cuenta está desactivada. Contacta al administrador.")}`,
    );
  }

  if (profile.must_change_password) {
    redirect("/auth/setup-password");
  }

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "trainer") redirect("/trainer");
  redirect("/client");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent("Escribe un correo electrónico válido.")}`,
    );
  }

  const supabase = createClient(await cookies());
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getAuthRedirectUrl("/auth/confirm?next=/auth/reset-password"),
  });

  redirect("/auth/forgot-password?sent=1");
}

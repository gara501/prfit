import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AppRole } from "@/lib/auth/roles";
import { isAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const requireAuthenticatedAccount = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "role, first_name, last_name, email, phone, birth_date, is_active, must_change_password",
    )
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.is_active !== true ||
    !isAppRole(profile.role)
  ) {
    redirect("/login");
  }

  if (profile.must_change_password) {
    redirect("/auth/setup-password");
  }

  const fullName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return {
    user,
    role: profile.role,
    displayName: fullName || user.email?.split("@")[0] || "Usuario",
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    birthDate: profile.birth_date ?? "",
    email: profile.email ?? user.email ?? "",
    phone: profile.phone ?? "",
  };
});

export async function requireRole(expectedRole: AppRole) {
  const account = await requireAuthenticatedAccount();

  if (account.role !== expectedRole) {
    redirect("/login");
  }

  return account;
}

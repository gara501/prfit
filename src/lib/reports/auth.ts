import "server-only";

import { cookies } from "next/headers";
import { isAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { ExportAuditInput, ExportRole } from "./types";

export async function getExportAccount() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,first_name,last_name,is_active,must_change_password")
    .eq("id", user.id)
    .maybeSingle();
  if (
    !profile ||
    !profile.is_active ||
    profile.must_change_password ||
    !isAppRole(profile.role)
  ) {
    return null;
  }

  return {
    id: user.id,
    role: profile.role as ExportRole,
    name:
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      "Usuario",
    supabase,
  };
}

export async function isActiveTrainerOf(
  account: NonNullable<Awaited<ReturnType<typeof getExportAccount>>>,
  clientId: string,
) {
  if (account.role !== "trainer") return false;
  const { data } = await account.supabase
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", account.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

export async function recordExportAudit(
  account: NonNullable<Awaited<ReturnType<typeof getExportAccount>>>,
  input: ExportAuditInput,
) {
  const { error } = await account.supabase.from("export_audit_events").insert({
    requester_id: account.id,
    client_id: input.clientId,
    export_type: input.exportType,
    routine_id: input.routineId ?? null,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    anonymized: input.anonymized ?? false,
    result: input.result,
    approximate_size_bytes: input.approximateSizeBytes ?? null,
  });
  if (error)
    console.error("No se pudo registrar la auditoría de exportación", error);
}

export function downloadHeaders(filename: string, contentType: string) {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `attachment; filename="${sanitizeFilename(filename)}"`,
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}

export function sanitizeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

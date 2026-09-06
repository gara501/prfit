import "server-only";

import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { decryptHealthValue } from "@/lib/health/crypto";
import type {
  HealthDecision,
  HealthScreeningPayload,
  HealthScreeningSummary,
} from "@/lib/health/types";
import { createClient } from "@/lib/supabase/server";

type ScreeningRow = {
  id: string;
  version: number;
  has_critical_risk: boolean;
  payload_ciphertext: string;
  encryption_iv: string;
  encryption_tag: string;
  submitted_at: string;
  expires_at: string;
};

type ReviewRow = {
  decision: HealthDecision;
  notes_ciphertext: string | null;
  encryption_iv: string | null;
  encryption_tag: string | null;
  reviewed_at: string;
};

export async function getOwnHealthScreening() {
  const account = await requireRole("client");
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("health_screenings")
    .select(
      "id,version,has_critical_risk,payload_ciphertext,encryption_iv,encryption_tag,submitted_at,expires_at",
    )
    .eq("client_id", account.user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    account,
    current: data
      ? await hydrateScreening(supabase, data as ScreeningRow)
      : null,
  };
}

export async function getTrainerHealthClients() {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data: links, error } = await supabase
    .from("trainer_clients")
    .select(
      "client_id,profiles!trainer_clients_client_id_fkey(first_name,last_name)",
    )
    .eq("trainer_id", account.user.id)
    .eq("is_active", true);
  if (error) return { clients: [], error: error.message };
  const clients = await Promise.all(
    (links ?? []).map(async (link) => {
      const { data } = await supabase
        .from("health_screenings")
        .select(
          "id,version,has_critical_risk,payload_ciphertext,encryption_iv,encryption_tag,submitted_at,expires_at",
        )
        .eq("client_id", link.client_id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const profile = link.profiles as unknown as {
        first_name: string | null;
        last_name: string | null;
      } | null;
      return {
        id: link.client_id,
        name:
          `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
          "Cliente",
        screening: data
          ? await hydrateScreening(supabase, data as ScreeningRow)
          : null,
      };
    }),
  );
  return { clients, error: "" };
}

export async function getTrainerClientHealth(clientId: string) {
  const account = await requireRole("trainer");
  const supabase = createClient(await cookies());
  const { data: assignment } = await supabase
    .from("trainer_clients")
    .select(
      "client:profiles!trainer_clients_client_id_fkey(first_name,last_name,birth_date)",
    )
    .eq("trainer_id", account.user.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  const profile = assignment?.client as unknown as {
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
  } | null;
  const { data } = await supabase
    .from("health_screenings")
    .select(
      "id,version,has_critical_risk,payload_ciphertext,encryption_iv,encryption_tag,submitted_at,expires_at",
    )
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!profile) return null;
  const screening = data
    ? await hydrateScreening(supabase, data as ScreeningRow)
    : null;
  const { data: documents } = screening
    ? await supabase
        .from("health_documents")
        .select("id,purpose,original_name,storage_path,created_at")
        .eq("screening_id", screening.summary.id)
    : { data: [] };
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (document) => {
      const { data: signed } = await supabase.storage
        .from("medical-documents")
        .createSignedUrl(document.storage_path, 300);
      return { ...document, url: signed?.signedUrl ?? "" };
    }),
  );
  return {
    client: {
      id: clientId,
      name:
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
        "Cliente",
    },
    screening,
    documents: docsWithUrls,
  };
}

async function hydrateScreening(
  supabase: ReturnType<typeof createClient>,
  row: ScreeningRow,
) {
  const { data: reviewData } = await supabase
    .from("health_screening_reviews")
    .select(
      "decision,notes_ciphertext,encryption_iv,encryption_tag,reviewed_at",
    )
    .eq("screening_id", row.id)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const review = reviewData as ReviewRow | null;
  const payload = decryptHealthValue<HealthScreeningPayload>({
    ciphertext: row.payload_ciphertext,
    iv: row.encryption_iv,
    tag: row.encryption_tag,
  });
  const reviewNotes =
    review?.notes_ciphertext && review.encryption_iv && review.encryption_tag
      ? decryptHealthValue<string>({
          ciphertext: review.notes_ciphertext,
          iv: review.encryption_iv,
          tag: review.encryption_tag,
        })
      : "";
  const summary: HealthScreeningSummary = {
    id: row.id,
    version: row.version,
    hasCriticalRisk: row.has_critical_risk,
    submittedAt: row.submitted_at,
    expiresAt: row.expires_at,
    decision: review?.decision ?? null,
    reviewNotes,
  };
  return { summary, payload };
}

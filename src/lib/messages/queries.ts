import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ConversationContact } from "./types";

export async function getConversationData(): Promise<{
  currentUserId: string;
  contacts: ConversationContact[];
  selectedContactId: string | null;
  messages: ChatMessage[];
  error: string | null;
}> {
  const account = await requireRoleForConversation();
  const supabase = createClient(await cookies());
  const contactResult =
    account.role === "trainer"
      ? await supabase
          .from("trainer_clients")
          .select(
            "client_id, client:profiles!trainer_clients_client_id_fkey(first_name, last_name)",
          )
          .eq("trainer_id", account.user.id)
          .eq("is_active", true)
      : await supabase
          .from("trainer_clients")
          .select(
            "trainer_id, trainer:profiles!trainer_clients_trainer_id_fkey(first_name, last_name)",
          )
          .eq("client_id", account.user.id)
          .eq("is_active", true)
          .maybeSingle();

  if (contactResult.error)
    return emptyConversation(account.user.id, contactResult.error.message);
  const contacts = toContacts(account.role, contactResult.data);
  const selectedContactId = contacts[0]?.id ?? null;
  if (!selectedContactId)
    return {
      currentUserId: account.user.id,
      contacts,
      selectedContactId: null,
      messages: [],
      error: null,
    };

  const filters =
    account.role === "trainer"
      ? { trainer_id: account.user.id, client_id: selectedContactId }
      : { trainer_id: selectedContactId, client_id: account.user.id };
  const { data, error } = await supabase
    .from("trainer_client_messages")
    .select("id, body, sender_id, sent_at, read_at")
    .match(filters)
    .order("sent_at");
  if (error)
    return emptyConversation(
      account.user.id,
      error.message,
      contacts,
      selectedContactId,
    );
  return {
    currentUserId: account.user.id,
    contacts,
    selectedContactId,
    messages: (data ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.sender_id,
      sentAt: message.sent_at,
      readAt: message.read_at,
    })),
    error: null,
  };
}

async function requireRoleForConversation() {
  const { requireAuthenticatedAccount } = await import(
    "@/lib/auth/require-role"
  );
  const account = await requireAuthenticatedAccount();
  if (account.role !== "trainer" && account.role !== "client")
    redirect("/admin");
  return account as typeof account & { role: "trainer" | "client" };
}

type ContactRelation = {
  first_name: string | null;
  last_name: string | null;
} | null;
function toContacts(
  role: "trainer" | "client",
  data: unknown,
): ConversationContact[] {
  const entries = (Array.isArray(data) ? data : data ? [data] : []) as Array<
    Record<string, unknown>
  >;
  return entries.map((entry) => {
    const relation = (
      role === "trainer" ? entry.client : entry.trainer
    ) as ContactRelation;
    const id = (
      role === "trainer" ? entry.client_id : entry.trainer_id
    ) as string;
    return {
      id,
      name:
        `${relation?.first_name ?? ""} ${relation?.last_name ?? ""}`.trim() ||
        "Contacto",
    };
  });
}
function emptyConversation(
  currentUserId: string,
  error: string,
  contacts: ConversationContact[] = [],
  selectedContactId: string | null = null,
) {
  return { currentUserId, contacts, selectedContactId, messages: [], error };
}

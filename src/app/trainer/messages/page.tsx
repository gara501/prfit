import { TrainerClientChat } from "@/components/messages/TrainerClientChat";
import { getConversationData } from "@/lib/messages/queries";

export default async function TrainerMessagesPage() {
  const data = await getConversationData();
  const contact = data.contacts.find(
    (item) => item.id === data.selectedContactId,
  );
  return (
    <main className="mx-auto max-w-5xl px-page-inline py-page-block">
      {data.error ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {data.error}
        </p>
      ) : contact ? (
        <TrainerClientChat
          currentUserId={data.currentUserId}
          trainerId={data.currentUserId}
          clientId={contact.id}
          contactName={contact.name}
          initialMessages={data.messages}
        />
      ) : (
        <EmptyChat />
      )}
    </main>
  );
}
function EmptyChat() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h1 className="text-xl font-black">Mensajes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No tienes clientes activos con quienes iniciar un chat.
      </p>
    </section>
  );
}

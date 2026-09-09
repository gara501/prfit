import Link from "next/link";
import { TrainerClientChat } from "@/components/messages/TrainerClientChat";
import { getConversationData } from "@/lib/messages/queries";

export default async function TrainerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const data = await getConversationData(client);
  const contact = data.contacts.find(
    (item) => item.id === data.selectedContactId,
  );
  return (
    <main className="mx-auto max-w-5xl px-page-inline py-page-block">
      {data.contacts.length > 1 ? (
        <nav aria-label="Conversaciones" className="mb-4 flex flex-wrap gap-2">
          {data.contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/trainer/messages?client=${contact.id}`}
              aria-current={
                contact.id === data.selectedContactId ? "page" : undefined
              }
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-bold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            >
              {contact.name}
            </Link>
          ))}
        </nav>
      ) : null}
      {data.error ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {data.error}
        </p>
      ) : contact ? (
        <TrainerClientChat
          key={contact.id}
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

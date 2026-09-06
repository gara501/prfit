import { PeriodizationEditor } from "@/components/periodization/PeriodizationEditor";
import { getPeriodizationWorkspace } from "@/lib/periodization/queries";

export default async function NewPeriodizationPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const { clients, error } = await getPeriodizationWorkspace();
  if (error) return <WorkspaceError message={error} />;
  const defaultClientId = clients.some((item) => item.id === client)
    ? client
    : undefined;
  return (
    <PeriodizationEditor
      clients={clients}
      defaultClientId={defaultClientId}
      plan={null}
    />
  );
}

function WorkspaceError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <h1 className="text-xl font-black">No fue posible abrir el editor</h1>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </main>
  );
}

import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { getRoutineWorkspace } from "@/lib/routines/queries";

export default async function NewRoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const { clients, exercises, error } = await getRoutineWorkspace();
  const defaultClientId = clients.some((item) => item.id === client)
    ? client
    : undefined;

  if (error) {
    return <WorkspaceError message={error} />;
  }

  return (
    <RoutineEditor
      clients={clients}
      defaultClientId={defaultClientId}
      exerciseOptions={exercises}
      routine={null}
    />
  );
}

function WorkspaceError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-xl font-black">No fue posible abrir el editor</h1>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </main>
  );
}

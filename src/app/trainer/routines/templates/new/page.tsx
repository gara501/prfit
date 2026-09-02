import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { getRoutineTemplateWorkspace } from "@/lib/routines/queries";

export default async function NewRoutineTemplatePage() {
  const { exercises, error } = await getRoutineTemplateWorkspace();
  if (error) return <TemplateWorkspaceError message={error} />;

  return (
    <RoutineEditor
      clients={[]}
      exerciseOptions={exercises}
      mode="template"
      routine={null}
    />
  );
}

function TemplateWorkspaceError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <h1 className="text-xl font-black">No fue posible abrir el editor</h1>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </main>
  );
}

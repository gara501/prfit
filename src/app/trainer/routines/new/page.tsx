import Link from "next/link";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import {
  getRoutineTemplates,
  getRoutineTemplateWorkspace,
  getRoutineWorkspace,
} from "@/lib/routines/queries";

export default async function NewRoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; template?: string }>;
}) {
  const { client, template: templateId } = await searchParams;
  const [{ clients, exercises, error }, templatesResult] = await Promise.all([
    getRoutineWorkspace(),
    getRoutineTemplates(),
  ]);
  const defaultClientId = clients.some((item) => item.id === client)
    ? client
    : undefined;
  const selectedTemplateResult = templateId
    ? await getRoutineTemplateWorkspace(templateId)
    : { template: null, error: null };
  const selectedTemplate = selectedTemplateResult.template;

  if (error || templatesResult.error || selectedTemplateResult.error) {
    return (
      <WorkspaceError
        message={
          error ??
          templatesResult.error ??
          selectedTemplateResult.error ??
          "Error desconocido"
        }
      />
    );
  }

  return (
    <>
      <section className="border-b border-border bg-card px-4 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">
              Punto de partida
            </p>
            <h2 className="mt-1 text-xl font-black text-foreground">
              {selectedTemplate
                ? `Copia de “${selectedTemplate.name}”`
                : "Rutina personalizada desde cero"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {selectedTemplate
                ? "Puedes modificarla libremente. La plantilla original y las rutinas de otros clientes no cambiarán."
                : "Elige una plantilla para precargar ejercicios o continúa con un plan vacío."}
            </p>
          </div>
          <form
            action="/trainer/routines/new"
            className="flex flex-col gap-2 sm:flex-row"
            method="get"
          >
            {defaultClientId ? (
              <input name="client" type="hidden" value={defaultClientId} />
            ) : null}
            <label className="sr-only" htmlFor="routine-template-selector">
              Plantilla de rutina
            </label>
            <select
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={selectedTemplate?.id ?? ""}
              id="routine-template-selector"
              name="template"
            >
              <option value="">Personalizada desde cero</option>
              {templatesResult.templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} · {template.daysAtWeek} días
                </option>
              ))}
            </select>
            <button
              className="min-h-11 rounded-xl bg-secondary px-4 text-sm font-black text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="submit"
            >
              Aplicar
            </button>
          </form>
          {templatesResult.templates.length === 0 ? (
            <Link
              className="text-sm font-black text-accent-foreground underline underline-offset-4"
              href="/trainer/routines/templates/new"
            >
              Crear la primera plantilla
            </Link>
          ) : null}
        </div>
      </section>
      <RoutineEditor
        clients={clients}
        defaultClientId={defaultClientId}
        exerciseOptions={exercises}
        key={selectedTemplate?.id ?? "custom"}
        routine={null}
        starterTemplate={selectedTemplate}
      />
    </>
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

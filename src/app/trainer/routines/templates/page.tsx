import Link from "next/link";
import { getRoutineTemplates } from "@/lib/routines/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function RoutineTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ templates, error }, query] = await Promise.all([
    getRoutineTemplates(),
    searchParams,
  ]);
  const message = error ?? query.error;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground"
              href="/trainer/routines"
            >
              ← Volver a rutinas
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">
              Plantillas
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Bases reutilizables para crear rutinas personalizadas sin repetir
              la programación. Cada asignación genera una copia independiente.
            </p>
          </div>
          <Link
            className="min-h-11 rounded-xl bg-primary px-5 py-3 text-center text-sm font-black text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/trainer/routines/templates/new"
          >
            + Nueva plantilla
          </Link>
        </header>

        {message ? (
          <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
            {message}
          </p>
        ) : null}

        {!message && templates.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border-strong bg-card p-8 sm:p-12">
            <h2 className="text-2xl font-black text-foreground">
              Aún no tienes plantillas
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Crea una estructura base con días, ejercicios y series. Después
              podrás seleccionarla al diseñar la rutina de cualquier cliente.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground"
              href="/trainer/routines/templates/new"
            >
              Crear plantilla
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article
                className="flex min-h-64 flex-col rounded-2xl border border-border bg-card p-6"
                key={template.id}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
                  {template.daysAtWeek} días · {template.exerciseCount}{" "}
                  ejercicios
                </p>
                <h2 className="mt-3 text-2xl font-black text-card-foreground">
                  {template.name}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {template.description || "Sin descripción."}
                </p>
                <p className="mt-auto pt-5 text-xs text-muted-foreground">
                  Actualizada{" "}
                  {dateFormatter.format(new Date(template.updatedAt))}
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <Link
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-secondary px-4 text-sm font-black text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                    href={`/trainer/routines/templates/${template.id}/edit`}
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

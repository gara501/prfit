import { ArrowLeft, CalendarDays, Dumbbell, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  activatePeriodizationPlan,
  archivePeriodizationPlan,
} from "@/lib/periodization/actions";
import { getPeriodizationWorkspace } from "@/lib/periodization/queries";
import {
  mesocycleFocusLabels,
  microcycleLoadLabels,
  periodizationStatusLabels,
} from "@/lib/periodization/types";

const formatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const formatDate = (date: string) =>
  formatter.format(new Date(`${date}T12:00:00`));

export default async function PeriodizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { planId } = await params;
  const [{ plan, error }, query] = await Promise.all([
    getPeriodizationWorkspace(planId),
    searchParams,
  ]);
  if (!plan && !error) notFound();
  if (error || !plan)
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          {error ?? "Plan no encontrado."}
        </p>
      </main>
    );
  const weeks = plan.mesocycles.flatMap((item) => item.weeks);
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/trainer/periodization"
        >
          <ArrowLeft className="size-4" /> Ciclos
        </Link>
        <header className="mt-3 flex flex-col gap-6 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-black text-muted-foreground">
                {periodizationStatusLabels[plan.status]}
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {weeks.length} semanas
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              {plan.name}
            </h1>
            <p className="mt-2 text-sm font-bold text-accent-foreground">
              {plan.clientName} · {formatDate(plan.startDate)} —{" "}
              {formatDate(plan.endDate)}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              {plan.goal || "Sin objetivo global documentado."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.status !== "archived" ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/trainer/periodization/${plan.id}/edit`}
              >
                <Pencil className="size-4" /> Editar
              </Link>
            ) : null}
            {plan.status === "draft" ? (
              <form action={activatePeriodizationPlan}>
                <input name="planId" type="hidden" value={plan.id} />
                <button
                  className="min-h-11 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  type="submit"
                >
                  Activar plan
                </button>
              </form>
            ) : null}
            {plan.status === "active" ? (
              <form action={archivePeriodizationPlan}>
                <input name="planId" type="hidden" value={plan.id} />
                <button
                  className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  type="submit"
                >
                  Archivar
                </button>
              </form>
            ) : null}
          </div>
        </header>
        {query.error ? (
          <p
            className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive"
            role="alert"
          >
            {query.error}
          </p>
        ) : null}

        <section
          className="mt-8 space-y-7"
          aria-label="Línea de tiempo del plan"
        >
          {plan.mesocycles.map((mesocycle) => (
            <article
              className="overflow-hidden rounded-3xl border border-border bg-card"
              key={mesocycle.id}
            >
              <header className="grid gap-4 border-b border-border bg-muted/40 p-5 sm:grid-cols-[1fr_auto] lg:p-6">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent-foreground">
                    Mesociclo {mesocycle.position} ·{" "}
                    {mesocycleFocusLabels[mesocycle.focus]}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">
                    {mesocycle.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mesocycle.objective || "Sin objetivo específico."}
                  </p>
                </div>
                <div className="flex gap-5 text-right">
                  <Scale label="Volumen" value={mesocycle.volumeLevel} />
                  <Scale label="Intensidad" value={mesocycle.intensityLevel} />
                </div>
              </header>
              <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
                {mesocycle.weeks.map((week) => (
                  <div
                    className="flex min-h-60 flex-col bg-card p-5"
                    key={week.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Semana {week.weekNumber}
                        </p>
                        <p className="mt-1 text-xs font-bold text-muted-foreground">
                          {formatDate(week.startDate)} —{" "}
                          {formatDate(week.endDate)}
                        </p>
                      </div>
                      <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black text-muted-foreground">
                        {microcycleLoadLabels[week.loadType]}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-black text-foreground">
                      {week.objective || "Objetivo semanal por definir"}
                    </p>
                    <div className="mt-4 flex gap-5">
                      <Scale label="Vol." value={week.volumeLevel} />
                      <Scale label="Int." value={week.intensityLevel} />
                    </div>
                    <div className="mt-auto pt-5">
                      {week.routine ? (
                        <Link
                          className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-3 text-sm font-black text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={`/trainer/routines/${week.routine.id}`}
                        >
                          <span className="min-w-0 truncate">
                            <Dumbbell className="mr-2 inline size-4" />
                            {week.routine.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            v{week.routine.versionNumber}
                          </span>
                        </Link>
                      ) : (
                        <Link
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-3 text-sm font-black text-secondary-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={`/trainer/routines/new?microcycle=${week.id}`}
                        >
                          <CalendarDays className="size-4" /> Diseñar rutina
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Scale({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-foreground">
        {value}
        <span className="text-xs text-muted-foreground">/5</span>
      </p>
    </div>
  );
}

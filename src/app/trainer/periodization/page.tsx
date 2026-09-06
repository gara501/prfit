import { ArrowRight, CalendarRange, Plus } from "lucide-react";
import Link from "next/link";
import { getPeriodizationPlans } from "@/lib/periodization/queries";
import {
  type PeriodizationStatus,
  periodizationStatusLabels,
} from "@/lib/periodization/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const formatDate = (value: string) =>
  dateFormatter.format(new Date(`${value}T12:00:00`));

export default async function PeriodizationPage() {
  const { plans, error } = await getPeriodizationPlans();
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">
              Planificación / Periodización
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Ciclos de entrenamiento
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Organiza objetivos de largo plazo en mesociclos y semanas con
              cargas diferenciadas.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/trainer/periodization/new"
          >
            <Plus className="size-4" /> Nuevo macrociclo
          </Link>
        </header>

        {error ? (
          <StatePanel
            title="No fue posible cargar la planificación"
            message={error}
          />
        ) : plans.length === 0 ? (
          <StatePanel
            title="Aún no hay ciclos planificados"
            message="Crea un macrociclo, divídelo en bloques de trabajo y después asigna una rutina a cada semana."
            action
          />
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Link
                className="group flex min-h-72 flex-col rounded-3xl border border-border bg-card p-6 text-card-foreground transition hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/trainer/periodization/${plan.id}`}
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <CalendarRange className="size-5" />
                  </span>
                  <Status status={plan.status} />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight">
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-accent-foreground">
                  {plan.clientName}
                </p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {plan.goal || "Sin objetivo global documentado."}
                </p>
                <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-5">
                  <Metric label="Bloques" value={plan.mesocycleCount} />
                  <Metric label="Semanas" value={plan.weekCount} />
                  <Metric
                    label="Rutinas"
                    value={`${plan.routineCount}/${plan.weekCount}`}
                  />
                </dl>
                <p className="mt-4 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>
                    {formatDate(plan.startDate)} — {formatDate(plan.endDate)}
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Status({ status }: { status: PeriodizationStatus }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-black text-muted-foreground">
      {periodizationStatusLabels[status]}
    </span>
  );
}
function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-black text-foreground">{value}</dd>
    </div>
  );
}
function StatePanel({
  action = false,
  message,
  title,
}: {
  action?: boolean;
  message: string;
  title: string;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-8 text-card-foreground">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      {action ? (
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground"
          href="/trainer/periodization/new"
        >
          Diseñar primer ciclo
        </Link>
      ) : null}
    </section>
  );
}

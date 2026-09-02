import { Dumbbell, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoutineVersionActions } from "@/components/routines/RoutineVersionActions";
import { getTrainerDashboard } from "@/lib/trainer-dashboard/queries";
import type { ClientRoutineSummary } from "@/lib/trainer-dashboard/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function TrainerClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { selected, error } = await getTrainerDashboard(clientId);

  // The dashboard query defaults to the first assigned client when the id is
  // unknown. A detail route must never make that fallback visible by URL.
  if (!selected || selected.client.id !== clientId) notFound();

  const { client, routines, sessions, measurements } = selected;
  const activeRoutine = routines.find(
    (routine) => routine.id === client.activeRoutineId,
  );
  const clientName =
    `${client.firstName} ${client.lastName}`.trim() || "Cliente";

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link
          className="inline-flex min-h-11 items-center text-label font-black uppercase text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/trainer/clients"
        >
          ← Clientes
        </Link>

        {error ? (
          <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <header className="mt-5 border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Ficha del cliente
          </p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-title font-black tracking-tight">
                {clientName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span>{client.email || "Correo sin registrar"}</span>
                <span>{client.phone || "Teléfono sin registrar"}</span>
                <span>
                  {getAge(client.birthDate) ?? "Edad sin registrar"}
                  {getAge(client.birthDate) === null ? "" : " años"}
                </span>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={`/trainer/measurements?client=${client.id}`}
            >
              Registrar medición
            </Link>
          </div>
        </header>

        <section className="grid border-b border-border sm:grid-cols-3">
          <Summary label="Rutinas" value={client.routineCount} />
          <Summary label="Sesiones" value={client.sessionCount} />
          <Summary
            label="Última sesión"
            value={
              client.lastSessionAt
                ? dateFormatter.format(new Date(client.lastSessionAt))
                : "Sin sesiones"
            }
          />
        </section>

        <section className="mt-7 border border-border bg-card">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="font-mono text-label font-black uppercase text-accent-foreground">
                Plan de entrenamiento
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Rutina actual
              </h2>
            </div>
            {!activeRoutine ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={`/trainer/routines/new?client=${client.id}`}
              >
                <Plus aria-hidden="true" className="size-4" />
                Asignar rutina
              </Link>
            ) : null}
          </div>

          {activeRoutine ? (
            <ActiveRoutine routine={activeRoutine} />
          ) : (
            <div className="p-7 sm:p-9">
              <Dumbbell
                aria-hidden="true"
                className="size-6 text-muted-foreground"
              />
              <p className="mt-4 text-lg font-black">Sin rutina activa</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Diseña un plan para este cliente. Al publicarlo quedará
                disponible para iniciar sus entrenamientos.
              </p>
            </div>
          )}
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-2">
          <ActivityPanel sessions={sessions} />
          <MeasurementPanel measurements={measurements} clientId={client.id} />
        </section>

        {routines.length > 0 ? (
          <section className="mt-7 border border-border bg-card">
            <div className="border-b border-border px-5 py-5 sm:px-7">
              <p className="font-mono text-label font-black uppercase text-accent-foreground">
                Historial de planes
              </p>
              <h2 className="mt-1 text-xl font-black">Todas las rutinas</h2>
            </div>
            <div className="divide-y divide-border">
              {routines.map((routine) => (
                <Link
                  className="flex min-h-14 items-center gap-4 px-5 py-4 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7"
                  href={`/trainer/routines/${routine.id}`}
                  key={routine.id}
                >
                  <span
                    className={`size-2 rounded-full ${routine.isActive ? "bg-success" : "bg-muted-foreground"}`}
                  />
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {routine.name}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {routine.status === "draft"
                      ? "Borrador"
                      : routine.status === "published"
                        ? "Publicada"
                        : "Archivada"}{" "}
                    · v{routine.versionNumber}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ActiveRoutine({ routine }: { routine: ClientRoutineSummary }) {
  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-success">
            Plan publicado y activo
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">
            {routine.name}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Versión {routine.versionNumber} · Desde{" "}
            {dateFormatter.format(new Date(`${routine.startDate}T12:00:00`))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-black hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={`/trainer/routines/${routine.id}`}
          >
            Ver rutina
          </Link>
          <RoutineVersionActions
            routineId={routine.id}
            status={routine.status}
          />
        </div>
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Pencil aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Para modificar una rutina publicada se crea una nueva versión editable;
        el historial del cliente se conserva.
      </p>
    </div>
  );
}

function ActivityPanel({
  sessions,
}: {
  sessions: {
    id: string;
    date: string;
    completedSets: number;
    totalSets: number;
  }[];
}) {
  return (
    <section className="border border-border bg-card">
      <div className="border-b border-border px-5 py-5 sm:px-7">
        <p className="font-mono text-label font-black uppercase text-accent-foreground">
          Actividad
        </p>
        <h2 className="mt-1 text-xl font-black">Sesiones recientes</h2>
      </div>
      {sessions.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Aún no ha realizado sesiones.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.slice(0, 5).map((session) => (
            <li
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm sm:px-7"
              key={session.id}
            >
              <span className="font-bold">
                {dateFormatter.format(new Date(session.date))}
              </span>
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {session.completedSets}/{session.totalSets} series
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MeasurementPanel({
  measurements,
  clientId,
}: {
  measurements: {
    id: string;
    date: string;
    weight: number | null;
    fatPercentage: number | null;
  }[];
  clientId: string;
}) {
  return (
    <section className="border border-border bg-card">
      <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
        <div>
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Progreso
          </p>
          <h2 className="mt-1 text-xl font-black">Últimas mediciones</h2>
        </div>
        <Link
          className="text-sm font-black text-accent-foreground hover:underline"
          href={`/trainer/measurements?client=${clientId}`}
        >
          Ver todas
        </Link>
      </div>
      {measurements.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Aún no hay mediciones registradas.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {measurements.slice(0, 5).map((measurement) => (
            <li
              className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-4 text-sm sm:px-7"
              key={measurement.id}
            >
              <span className="font-bold">
                {dateFormatter.format(new Date(`${measurement.date}T12:00:00`))}
              </span>
              <span>
                {measurement.weight === null ? "—" : `${measurement.weight} kg`}
              </span>
              <span className="text-muted-foreground">
                {measurement.fatPercentage === null
                  ? "—"
                  : `${measurement.fatPercentage}%`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-r border-border px-5 py-4 last:border-r-0 sm:px-8">
      <dt className="font-mono text-label font-black uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black">{value}</dd>
    </div>
  );
}

function getAge(birthDate: string) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age -= 1;
  return age;
}

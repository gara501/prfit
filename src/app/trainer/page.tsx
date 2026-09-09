import Link from "next/link";
import { ClientSelector } from "@/components/trainer-dashboard/ClientSelector";
import { CreateClientForm } from "@/components/trainer-dashboard/CreateClientForm";
import { saveClientPrivateContext } from "@/lib/trainer-dashboard/actions";
import { getTrainerDashboard } from "@/lib/trainer-dashboard/queries";
import type {
  ClientMeasurementSummary,
  ClientSessionSummary,
  TrainerClientSummary,
} from "@/lib/trainer-dashboard/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function TrainerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; context?: string }>;
}) {
  const { client: selectedClientId, context } = await searchParams;
  const { clients, selected, error } =
    await getTrainerDashboard(selectedClientId);
  const activeRoutines = clients.reduce(
    (total, client) => total + client.activeRoutineCount,
    0,
  );
  const sessions = clients.reduce(
    (total, client) => total + client.sessionCount,
    0,
  );

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-[90rem]">
        {context ? (
          <p
            role={context === "error" ? "alert" : "status"}
            className="mb-4 rounded-xl border border-border bg-card p-4 text-foreground"
          >
            {context === "error"
              ? "No se guardó el contexto. Intenta nuevamente."
              : "Contexto guardado."}
          </p>
        ) : null}
        <header className="mb-8 flex flex-col gap-6 border-b border-slate-300 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Centro de entrenamiento
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Tus entrenados.
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Selecciona un deportista para revisar su contexto, medir su
              actividad y diseñar el siguiente bloque de trabajo.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300">
            <HeaderStat label="Clientes" value={clients.length} />
            <HeaderStat label="Planes activos" value={activeRoutines} />
            <HeaderStat label="Sesiones" value={sessions} />
          </dl>
        </header>

        {error ? (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </p>
        ) : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-6">
            <section className="border border-border bg-card p-4 sm:flex sm:items-end sm:justify-between sm:gap-5">
              <div>
                <p className="font-mono text-label font-black uppercase text-accent-foreground">
                  Clientes asignados
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulta un deportista sin expandir la pantalla a medida que
                  crece tu cartera.
                </p>
              </div>
              <ClientSelector
                clients={clients.map((client) => ({
                  id: client.id,
                  label: `${activitySymbol(client.activityStatus)} ${displayName(client)} — ${activityText(client.activityStatus)}`,
                }))}
                selectedClientId={selected?.client.id ?? ""}
              />
            </section>

            {selected ? (
              <ClientWorkspace selected={selected} />
            ) : (
              <section className="grid min-h-[32rem] place-items-center rounded-3xl border border-dashed border-slate-400 bg-white/60 p-10 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-500 text-2xl font-black">
                    +
                  </span>
                  <h2 className="mt-4 text-2xl font-black">
                    Crea tu primer cliente
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Al crearlo quedará vinculado automáticamente y podrás
                    diseñar su rutina desde esta misma ficha.
                  </p>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6 xl:sticky xl:top-28">
            <aside
              className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]"
              id="new-client"
            >
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">
                Ampliar cartera
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Nuevo cliente
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Crea su acceso y comienza a planificar.
              </p>
              <CreateClientForm />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function ClientWorkspace({
  selected,
}: {
  selected: NonNullable<
    Awaited<ReturnType<typeof getTrainerDashboard>>["selected"]
  >;
}) {
  const { client, routines, sessions, measurements } = selected;
  const age = getAge(client.birthDate);
  return (
    <div className="min-w-0 space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-orange-500 p-7 text-slate-950 sm:p-9">
        <div className="absolute -right-16 -top-20 size-56 rounded-full border-[30px] border-slate-950/10" />
        <div className="relative">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em]">
            Ficha del deportista
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.045em]">
            {displayName(client)}
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-800">
            <span>{age === null ? "Edad sin registrar" : `${age} años`}</span>
            <span>
              Desde {dateFormatter.format(new Date(client.registerDate))}
            </span>
            <span>
              Último entreno:{" "}
              {client.lastSessionAt
                ? dateFormatter.format(new Date(client.lastSessionAt))
                : "sin sesiones"}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              href={`/trainer/routines/new?client=${client.id}`}
            >
              + Crear rutina
            </Link>
            <Link
              className="rounded-xl border border-slate-950/20 bg-white/50 px-5 py-3 text-sm font-black"
              href={`/trainer/measurements?client=${client.id}`}
            >
              Registrar medición
            </Link>
            <Link
              className="rounded-xl border border-slate-950/20 bg-white/50 px-5 py-3 text-sm font-black"
              href={`/trainer/history?client=${client.id}`}
            >
              Ver historial
            </Link>
            <Link
              className="rounded-xl border border-slate-950/20 bg-white/50 px-5 py-3 text-sm font-black"
              href="/trainer/calendar"
            >
              Programar sesión
            </Link>
            <Link
              className="rounded-xl border border-slate-950/20 bg-white/50 px-5 py-3 text-sm font-black"
              href="/trainer/progressions"
            >
              Ver progresiones
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DataCard label="Planes activos" value={client.activeRoutineCount} />
        <DataCard label="Sesiones" value={client.sessionCount} />
        <DataCard
          label="Peso actual"
          value={
            client.latestWeight === null ? "—" : `${client.latestWeight} kg`
          }
        />
        <DataCard
          label="Grasa actual"
          value={
            client.latestFatPercentage === null
              ? "—"
              : `${client.latestFatPercentage}%`
          }
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
        <SectionHeader
          action={
            <Link
              className="text-xs font-black text-orange-700"
              href={`/trainer/routines/new?client=${client.id}`}
            >
              Nueva rutina →
            </Link>
          }
          eyebrow="Planificación"
          title="Rutinas del cliente"
        />
        {routines.length === 0 ? (
          <EmptyRow text="Todavía no tiene rutinas diseñadas." />
        ) : (
          <div className="divide-y divide-slate-200">
            {routines.slice(0, 5).map((routine) => (
              <Link
                className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/60"
                href={`/trainer/routines/${routine.id}`}
                key={routine.id}
              >
                <span
                  className={`size-2 rounded-full ${
                    routine.status === "published" && routine.isActive
                      ? "bg-emerald-500"
                      : routine.status === "draft"
                        ? "bg-amber-400"
                        : "bg-slate-300"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate font-black">
                  {routine.name}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {routine.status === "draft"
                    ? `Borrador · v${routine.versionNumber}`
                    : routine.status === "published"
                      ? `Publicada · v${routine.versionNumber}`
                      : `Archivada · v${routine.versionNumber}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SessionPanel sessions={sessions} />
        <MeasurementPanel measurements={measurements} clientId={client.id} />
      </div>
      <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
        <SectionHeader
          eyebrow="Contexto privado"
          title="Objetivos y restricciones"
        />
        <form
          action={saveClientPrivateContext}
          className="grid gap-5 p-6 sm:p-7"
        >
          <input name="clientId" type="hidden" value={client.id} />
          <label className="grid gap-2 text-sm font-black">
            Objetivos
            <textarea
              className="min-h-24 rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={selected.context.goals}
              maxLength={4000}
              name="goals"
              placeholder="Objetivos acordados y prioridades del bloque."
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Restricciones o lesiones
            <textarea
              className="min-h-24 rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={selected.context.restrictions}
              maxLength={4000}
              name="restrictions"
              placeholder="Restricciones de carga, lesiones y adaptaciones necesarias."
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Notas privadas del entrenador
            <textarea
              className="min-h-32 rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={selected.context.privateNotes}
              maxLength={8000}
              name="privateNotes"
              placeholder="Observaciones internas; este contenido no es visible para el cliente."
            />
          </label>
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500">
              Solo tú, como trainer asignado, puedes consultar este contexto.
            </p>
            <button
              className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              type="submit"
            >
              Guardar contexto
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SessionPanel({ sessions }: { sessions: ClientSessionSummary[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
      <SectionHeader eyebrow="Ejecución" title="Sesiones recientes" />
      {sessions.length === 0 ? (
        <EmptyRow text="Aún no ha ejecutado sesiones." />
      ) : (
        <div className="divide-y divide-slate-100">
          {sessions.slice(0, 5).map((session) => (
            <div className="flex items-center gap-3 px-6 py-4" key={session.id}>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-xs font-black">
                {session.completedSets === session.totalSets ? "✓" : "▶"}
              </span>
              <span className="flex-1 text-sm font-bold">
                {dateFormatter.format(new Date(session.date))}
              </span>
              <span className="font-mono text-xs font-black text-slate-400">
                {session.completedSets}/{session.totalSets}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MeasurementPanel({
  measurements,
  clientId,
}: {
  measurements: ClientMeasurementSummary[];
  clientId: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
      <SectionHeader
        action={
          <Link
            className="text-xs font-black text-orange-700"
            href={`/trainer/measurements?client=${clientId}`}
          >
            Medir →
          </Link>
        }
        eyebrow="Progreso"
        title="Últimos controles"
      />
      {measurements.length === 0 ? (
        <EmptyRow text="Aún no hay mediciones corporales." />
      ) : (
        <div className="divide-y divide-slate-100">
          {measurements.slice(0, 5).map((measurement) => (
            <div
              className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 text-sm"
              key={measurement.id}
            >
              <span className="font-bold">
                {dateFormatter.format(new Date(`${measurement.date}T12:00:00`))}
              </span>
              <span className="font-black">
                {measurement.weight === null ? "—" : `${measurement.weight} kg`}
              </span>
              <span className="font-black text-slate-400">
                {measurement.fatPercentage === null
                  ? "—"
                  : `${measurement.fatPercentage}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-lg font-black">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-28 bg-white px-4 py-3">
      <dt className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black">{value}</dd>
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4">
      <p className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-6 py-8 text-sm text-slate-500">{text}</p>;
}

function displayName(client: TrainerClientSummary) {
  return `${client.firstName} ${client.lastName}`.trim() || "Cliente";
}

function activityText(status: TrainerClientSummary["activityStatus"]) {
  return {
    trained_today: "Entrenó hoy",
    pending: "Sin entrenar hoy",
    inactive: "7+ días sin actividad",
  }[status];
}
function activitySymbol(status: TrainerClientSummary["activityStatus"]) {
  return { trained_today: "✓", pending: "○", inactive: "!" }[status];
}

function getAge(birthDate: string) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());
  if (hasNotHadBirthday) age -= 1;
  return age;
}

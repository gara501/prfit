import Link from "next/link";
import { getTrainerRoutines } from "@/lib/routines/queries";
import { routineVersionLabels } from "@/lib/routines/versioning";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function TrainerRoutinesPage() {
  const { routines, error } = await getTrainerRoutines();
  const activeCount = routines.filter(
    (routine) => routine.status === "published" && routine.isActive,
  ).length;
  const draftCount = routines.filter(
    (routine) => routine.status === "draft",
  ).length;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-col gap-6 border-b border-slate-300 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
              Programación / Rutinas
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Planes de entrenamiento
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Diseña, revisa y ajusta el trabajo prescrito para cada deportista.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="min-h-11 rounded-xl border border-border-strong bg-card px-5 py-3 text-center text-sm font-black text-card-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/trainer/routines/templates"
            >
              Plantillas
            </Link>
            <Link
              className="min-h-11 rounded-xl bg-primary px-5 py-3 text-center text-sm font-black text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/trainer/routines/new"
            >
              + Nueva rutina
            </Link>
          </div>
        </header>

        <div className="mb-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 sm:w-fit">
          <Stat label="Rutinas" value={routines.length} />
          <Stat label="Activas" value={activeCount} />
          <Stat label="Borradores" value={draftCount} />
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="font-black">No fue posible cargar las rutinas</h2>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : routines.length === 0 ? (
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-300 bg-slate-950 px-7 py-16 text-white sm:px-12">
            <div className="absolute -right-16 -top-20 size-64 rounded-full border-[32px] border-orange-500/20" />
            <div className="relative max-w-xl">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                Tablero vacío
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                El primer plan empieza aquí.
              </h2>
              <p className="mt-3 leading-7 text-slate-400">
                Vincula un cliente, prepara el catálogo de ejercicios y
                construye su primera rutina con series, carga y descanso.
              </p>
              <Link
                className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-orange-400"
                href="/trainer/routines/new"
              >
                Diseñar primera rutina
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {routines.map((routine, index) => (
              <Link
                className="group flex min-h-72 flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_22px_55px_-45px_rgba(15,23,42,0.9)] transition hover:-translate-y-1 hover:border-slate-500"
                href={`/trainer/routines/${routine.id}`}
                key={routine.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-4xl font-black tracking-[-0.08em] text-slate-200 transition group-hover:text-orange-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      routine.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : routine.status === "draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {routineVersionLabels[routine.status]} · v
                    {routine.versionNumber}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                  {routine.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-orange-700">
                  {routine.clientName}
                </p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                  {routine.description || "Sin descripción adicional."}
                </p>
                <div className="mt-auto grid grid-cols-3 gap-3 border-t border-slate-200 pt-5 text-sm">
                  <Metric label="Ejercicios" value={routine.exerciseCount} />
                  <Metric label="Días/sem" value={routine.daysAtWeek ?? "—"} />
                  <Metric
                    label="Inicio"
                    value={dateFormatter.format(
                      new Date(`${routine.startDate}T12:00:00`),
                    )}
                  />
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-32 bg-white px-5 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate font-black text-slate-800">{value}</p>
    </div>
  );
}

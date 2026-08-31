import Link from "next/link";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import { getClientDashboardData } from "@/lib/measurements/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function ClientDashboardPage() {
  const { measurements, activeRoutines, sessionCount, error } =
    await getClientDashboardData();
  const latest = measurements.at(-1);
  const weightPoints = measurements.flatMap((measurement) =>
    measurement.weight === null
      ? []
      : [{ date: measurement.date, value: measurement.weight }],
  );
  const fatPoints = measurements.flatMap((measurement) =>
    measurement.fatPercentage === null
      ? []
      : [{ date: measurement.date, value: measurement.fatPercentage }],
  );

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10">
          <div className="absolute -right-20 -top-24 size-72 rounded-full border-[38px] border-orange-500/20" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                Tu progreso
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">
                Entrenar deja huella.
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                Aquí se encuentran tu planificación, las sesiones realizadas y
                la evolución medida por tu entrenador.
              </p>
            </div>
            <Link
              className="rounded-xl bg-orange-500 px-6 py-3 text-center text-sm font-black text-slate-950 hover:bg-orange-400"
              href="/client/sessions"
            >
              Ir a entrenar
            </Link>
          </div>
        </header>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </p>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Rutinas activas" value={activeRoutines} />
          <Metric label="Sesiones" value={sessionCount} />
          <Metric
            label="Peso actual"
            value={
              latest?.weight === null || latest?.weight === undefined
                ? "—"
                : `${latest.weight} kg`
            }
          />
          <Metric
            label="Último control"
            value={
              latest
                ? dateFormatter.format(new Date(`${latest.date}T12:00:00`))
                : "Pendiente"
            }
          />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black hover:border-orange-400"
            href="/client/calendar"
          >
            Calendario y adherencia →
          </Link>
          <Link
            className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black hover:border-orange-400"
            href="/client/history"
          >
            Historial por ejercicio →
          </Link>
          <Link
            className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black hover:border-orange-400"
            href="/client/sessions"
          >
            Mis sesiones y feedback →
          </Link>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <ProgressChart
            color="orange"
            points={weightPoints}
            title="Peso corporal"
            unit="kg"
          />
          <ProgressChart
            color="emerald"
            points={fatPoints}
            title="Porcentaje de grasa"
            unit="%"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 sm:p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                Último registro
              </p>
              <h2 className="mt-1 text-2xl font-black">Medidas corporales</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {latest
                ? dateFormatter.format(new Date(`${latest.date}T12:00:00`))
                : "Sin datos"}
            </span>
          </div>
          {latest ? (
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4 lg:grid-cols-6">
              <Measure label="Cintura" value={latest.waist} />
              <Measure label="Cadera" value={latest.hips} />
              <Measure label="Pecho" value={latest.chest} />
              <Measure label="Hombros" value={latest.shoulders} />
              <Measure label="Brazo der." value={latest.rightArm} />
              <Measure label="Brazo izq." value={latest.leftArm} />
            </dl>
          ) : (
            <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              Tu entrenador todavía no ha registrado una medición corporal.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5">
      <p className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function Measure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white p-4">
      <dt className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black">
        {value === null ? "—" : `${value} cm`}
      </dd>
    </div>
  );
}

import Link from "next/link";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import {
  formatTrainingVolume,
  getEstimatedOneRepMaxTrend,
  getLatestSessionComparison,
} from "@/lib/history/metrics";
import type { ExerciseHistoryData } from "@/lib/history/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type HistoryHref = (exerciseId?: string, offset?: number) => string;

export function ExerciseHistoryView({
  history,
  hrefFor,
}: {
  history: ExerciseHistoryData;
  hrefFor: HistoryHref;
}) {
  if (history.error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
        No pudimos cargar el historial: {history.error}
      </p>
    );
  }

  if (history.overview.length === 0) {
    return (
      <section className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <div className="max-w-sm">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Historial por ejercicio
          </p>
          <h2 className="mt-2 text-2xl font-black">Aún no hay registros</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Las sesiones finalizadas aparecerán aquí cuando contengan sets
            completados.
          </p>
        </div>
      </section>
    );
  }

  const selected = history.selected;
  if (!selected) return null;
  const oneRepMaxTrend = getEstimatedOneRepMaxTrend(history.sessions);
  const comparison = getLatestSessionComparison(history.sessions);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-3xl border border-slate-300 bg-white xl:sticky xl:top-28">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Ejercicios registrados
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {history.overview.length} con sesiones finalizadas
          </p>
        </div>
        <nav
          aria-label="Ejercicios con historial"
          className="max-h-[58vh] overflow-y-auto p-2"
        >
          {history.overview.map((exercise) => {
            const isSelected = exercise.exerciseId === selected.exerciseId;
            return (
              <Link
                aria-current={isSelected ? "page" : undefined}
                className={`block rounded-2xl px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  isSelected ? "bg-slate-950 text-white" : "hover:bg-orange-50"
                }`}
                href={hrefFor(exercise.exerciseId)}
                key={exercise.exerciseId}
              >
                <span className="block truncate text-sm font-black">
                  {exercise.exerciseName}
                </span>
                <span
                  className={`mt-1 block font-mono text-[10px] font-bold ${
                    isSelected ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {exercise.sessionCount} sesiones ·{" "}
                  {formatShortDate(exercise.lastPerformedAt)}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Rendimiento registrado
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {selected.exerciseName}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            El volumen excluye calentamientos. El 1RM es una estimación con la
            fórmula de Epley: peso × (1 + repeticiones / 30).
          </p>
          <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-slate-700 bg-slate-700 sm:grid-cols-4">
            <HistoryStat label="Sesiones" value={selected.sessionCount} />
            <HistoryStat
              label="Sets de trabajo"
              value={selected.workSetCount}
            />
            <HistoryStat
              label="Volumen"
              value={`${formatTrainingVolume(selected.totalVolume)} kg`}
            />
            <HistoryStat
              label="Mayor carga"
              value={
                selected.maxWeight === null ? "—" : `${selected.maxWeight} kg`
              }
            />
          </dl>
          {comparison ? (
            <p className="mt-4 text-xs font-bold text-slate-300">
              Última sesión vs.{" "}
              {formatShortDate(comparison.previousPerformedAt)}:{" "}
              {formatDelta(comparison.volumeDelta, "kg de volumen")}
              {comparison.estimated1RmDelta === null
                ? ""
                : ` · ${formatDelta(comparison.estimated1RmDelta, "kg de 1RM estimado")}`}
            </p>
          ) : null}
        </section>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.7fr)]">
          <ProgressChart
            color="orange"
            points={oneRepMaxTrend}
            title="1RM estimado"
            unit="kg"
          />
          <RepRangeBests bests={history.repRangeBests} />
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                Sesiones recientes
              </p>
              <h3 className="mt-1 text-xl font-black">Sets registrados</h3>
            </div>
            <p className="text-xs font-bold text-slate-500">
              Página {Math.floor(history.offset / 12) + 1}
            </p>
          </div>
          {history.sessions.length === 0 ? (
            <p className="p-8 text-sm text-slate-500">
              No hay más sesiones para este ejercicio.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {history.sessions.map((session) => (
                <article className="p-5 sm:p-7" key={session.id}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h4 className="font-black">
                      {dateFormatter.format(
                        new Date(`${session.performedAt}T12:00:00`),
                      )}
                    </h4>
                    <span className="font-mono text-xs font-black text-slate-500">
                      {formatTrainingVolume(totalSessionVolume(session.sets))}{" "}
                      kg
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                      <thead className="border-y border-slate-100 font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-2 py-3">Set</th>
                          <th className="px-2 py-3">Carga</th>
                          <th className="px-2 py-3">Reps</th>
                          <th className="px-2 py-3">Esfuerzo</th>
                          <th className="px-2 py-3 text-right">1RM est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {session.sets.map((set) => (
                          <tr
                            className={
                              set.isWarmup ? "text-slate-400" : "text-slate-800"
                            }
                            key={set.id}
                          >
                            <td className="px-2 py-3 font-black">
                              {set.isWarmup
                                ? "Calentamiento"
                                : `Set ${set.setNumber}`}
                            </td>
                            <td className="px-2 py-3 font-bold">
                              {set.weight === null ? "—" : `${set.weight} kg`}
                            </td>
                            <td className="px-2 py-3 font-bold">
                              {set.reps ?? "—"}
                            </td>
                            <td className="px-2 py-3 font-bold">
                              {formatEffort(set.actualRir, set.actualRpe)}
                            </td>
                            <td className="px-2 py-3 text-right font-black">
                              {set.estimated1Rm === null
                                ? "—"
                                : `${set.estimated1Rm.toFixed(1)} kg`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:px-7">
            {history.offset > 0 ? (
              <Link
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black hover:border-slate-950"
                href={hrefFor(
                  selected.exerciseId,
                  Math.max(0, history.offset - 12),
                )}
              >
                Sesiones más recientes
              </Link>
            ) : (
              <span />
            )}
            {history.hasMore ? (
              <Link
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
                href={hrefFor(selected.exerciseId, history.offset + 12)}
              >
                Sesiones anteriores
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function RepRangeBests({
  bests,
}: {
  bests: ExerciseHistoryData["repRangeBests"];
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
          Mejores sets
        </p>
        <h3 className="mt-1 text-xl font-black">Por rango de repeticiones</h3>
      </div>
      {bests.length === 0 ? (
        <p className="px-5 py-8 text-sm leading-6 text-slate-500">
          No hay sets de trabajo con repeticiones registradas.
        </p>
      ) : (
        <dl className="divide-y divide-slate-100">
          {bests.map((best) => (
            <div
              className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4"
              key={best.repRange}
            >
              <dt>
                <p className="font-black">{best.repRange}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {best.weight ?? "—"} kg × {best.reps}
                </p>
              </dt>
              <dd className="text-right">
                <p className="font-black">
                  {best.estimated1Rm === null
                    ? "—"
                    : `${best.estimated1Rm.toFixed(1)} kg`}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  {formatShortDate(best.performedAt)}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function HistoryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-950 px-4 py-4">
      <dt className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-black">{value}</dd>
    </div>
  );
}

function totalSessionVolume(
  sets: ExerciseHistoryData["sessions"][number]["sets"],
) {
  return sets.reduce((total, set) => total + set.volume, 0);
}

function formatEffort(rir: number | null, rpe: number | null) {
  if (rir !== null && rpe !== null) return `RIR ${rir} · RPE ${rpe}`;
  if (rir !== null) return `RIR ${rir}`;
  if (rpe !== null) return `RPE ${rpe}`;
  return "—";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDelta(value: number, unit: string) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} ${unit}`;
}

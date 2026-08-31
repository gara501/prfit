import Link from "next/link";
import {
  applyProgressionSuggestion,
  generateProgressionSuggestions,
  saveProgressionRule,
} from "@/lib/progressions/actions";
import { getProgressionWorkspace } from "@/lib/progressions/queries";

export default async function ProgressionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    routine?: string;
    error?: string;
    saved?: string;
    generated?: string;
  }>;
}) {
  const params = await searchParams;
  const { routines, routine, rules, suggestions, error } =
    await getProgressionWorkspace(params.routine);
  const message = error ?? params.error;
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-300 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Planificación
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Progresión configurable
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Las sugerencias se generan desde sesiones cerradas y solo se
              aplican a un borrador del plan.
            </p>
          </div>
          {routine ? (
            <form action={generateProgressionSuggestions}>
              <input name="routineId" type="hidden" value={routine.id} />
              <button
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                type="submit"
              >
                Generar sugerencias
              </button>
            </form>
          ) : null}
        </header>
        {message ? (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {message}
          </p>
        ) : null}
        {params.saved ? (
          <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            Regla de progresión guardada.
          </p>
        ) : null}
        {params.generated !== undefined ? (
          <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {params.generated} sugerencia{params.generated === "1" ? "" : "s"}{" "}
            generada{params.generated === "1" ? "" : "s"}.
          </p>
        ) : null}
        {routines.length > 0 ? (
          <nav
            aria-label="Rutinas publicadas"
            className="mb-6 flex gap-2 overflow-x-auto pb-1"
          >
            {routines.map((item) => (
              <Link
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${item.id === routine?.id ? "bg-slate-950 text-white" : "border border-slate-300 bg-white"}`}
                href={`/trainer/progressions?routine=${item.id}`}
                key={item.id}
              >
                {item.clientName} · {item.name}
              </Link>
            ))}
          </nav>
        ) : null}
        {!routine ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <h2 className="text-2xl font-black">No hay rutinas publicadas</h2>
            <p className="mt-2 text-sm text-slate-500">
              Publica una rutina para configurar su progresión.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {routine.exercises.map((exercise) => {
              const rule = rules.find(
                (item) => item.routine_exercise_id === exercise.id,
              );
              const pending = suggestions.find(
                (item) =>
                  item.source_routine_exercise_id === exercise.id &&
                  item.status === "pending",
              );
              return (
                <article
                  className="overflow-hidden rounded-3xl border border-slate-300 bg-white"
                  key={exercise.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
                    <div>
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                        Día {exercise.dayNumber} · bloque{" "}
                        {exercise.orderIndex + 1}
                      </p>
                      <h2 className="mt-1 text-xl font-black">
                        {exercise.exerciseName}
                      </h2>
                    </div>
                    {pending ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                        Sugerencia pendiente
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] sm:p-7">
                    <form
                      action={saveProgressionRule}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      <input
                        name="routineId"
                        type="hidden"
                        value={routine.id}
                      />
                      <input
                        name="routineExerciseId"
                        type="hidden"
                        value={exercise.id}
                      />
                      <label className="text-xs font-bold text-slate-600">
                        Método
                        <select
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold"
                          defaultValue={rule?.strategy ?? "manual"}
                          name="strategy"
                        >
                          <option value="double_progression">
                            Progresión doble
                          </option>
                          <option value="fixed_increment">
                            Incremento fijo
                          </option>
                          <option value="manual">Control manual</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-slate-600">
                        Incremento (kg)
                        <input
                          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold"
                          defaultValue={rule?.increment_kg ?? 2.5}
                          min="0"
                          name="incrementKg"
                          step="0.25"
                          type="number"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">
                        Sesiones exitosas
                        <input
                          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold"
                          defaultValue={rule?.successful_sessions_required ?? 2}
                          min="1"
                          name="successfulSessions"
                          type="number"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">
                        {routine.effortMetric.toUpperCase()} objetivo (opcional)
                        <input
                          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold"
                          defaultValue={rule?.target_effort ?? ""}
                          max="10"
                          min="0"
                          name="targetEffort"
                          type="number"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input
                          defaultChecked={rule?.deload_on_fail ?? false}
                          name="deloadOnFail"
                          type="checkbox"
                        />{" "}
                        Reducir tras fallos
                      </label>
                      <label className="text-xs font-bold text-slate-600">
                        Reducción (%)
                        <input
                          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold"
                          defaultValue={rule?.reduction_percent ?? 10}
                          min="1"
                          name="reductionPercent"
                          type="number"
                        />
                      </label>
                      <input
                        name="failureSessions"
                        type="hidden"
                        value={rule?.failure_sessions_required ?? 2}
                      />
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input
                          defaultChecked={rule?.enabled ?? true}
                          name="enabled"
                          type="checkbox"
                        />{" "}
                        Regla activa
                      </label>
                      <div className="flex items-end">
                        <button
                          className="rounded-xl border border-slate-950 px-4 py-2.5 text-sm font-black hover:bg-slate-950 hover:text-white"
                          type="submit"
                        >
                          Guardar regla
                        </button>
                      </div>
                    </form>
                    <SuggestionCard pending={pending} routineId={routine.id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SuggestionCard({
  pending,
  routineId,
}: {
  pending:
    | {
        id: string;
        strategy: string;
        proposed_weight: number | null;
        rationale: string;
      }
    | undefined;
  routineId: string;
}) {
  if (!pending)
    return (
      <aside className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Sugerencia
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Genera sugerencias cuando haya sesiones suficientes.
        </p>
      </aside>
    );
  return (
    <aside className="rounded-2xl bg-slate-950 p-5 text-white">
      <p className="font-mono text-[10px] font-black uppercase tracking-wider text-orange-400">
        Sugerencia auditable
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {pending.rationale}
      </p>
      {pending.proposed_weight !== null ? (
        <p className="mt-4 text-2xl font-black">{pending.proposed_weight} kg</p>
      ) : (
        <p className="mt-4 text-sm font-bold">Define el ajuste manual.</p>
      )}
      <form action={applyProgressionSuggestion} className="mt-4 space-y-3">
        <input name="routineId" type="hidden" value={routineId} />
        <input name="suggestionId" type="hidden" value={pending.id} />
        {pending.strategy === "manual" ? (
          <label className="block text-xs font-bold text-slate-300">
            Nuevo peso (kg)
            <input
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-white"
              min="0"
              name="manualWeight"
              step="0.25"
              type="number"
            />
          </label>
        ) : null}
        <button
          className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-slate-950"
          type="submit"
        >
          Aplicar al borrador
        </button>
      </form>
    </aside>
  );
}

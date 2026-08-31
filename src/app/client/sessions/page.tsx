import Link from "next/link";
import { startWorkoutSession } from "@/lib/sessions/actions";
import { getClientSessionsHome } from "@/lib/sessions/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ClientSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const { routines, sessions, error } = await getClientSessionsHome();

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 border-b border-slate-300 pb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
            Zona de entrenamiento
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Mis sesiones
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Elige el plan de hoy y registra cada serie mientras entrenas.
          </p>
        </header>

        {error || actionError ? (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error ?? actionError}
          </p>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                Entrenar ahora
              </p>
              <h2 className="mt-1 text-2xl font-black">Rutinas activas</h2>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
              {routines.length}
            </span>
          </div>

          {routines.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-400 bg-white/60 p-10 text-center">
              <h3 className="text-xl font-black">
                No tienes una rutina activa
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Tu entrenador debe asignarte un plan vigente antes de comenzar.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {routines.map((routine) => (
                <article
                  className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-[0_22px_55px_-45px_rgba(15,23,42,0.9)]"
                  key={routine.id}
                >
                  <div className="p-6 sm:p-7">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                      {routine.days.reduce(
                        (total, day) => total + day.exerciseCount,
                        0,
                      )}{" "}
                      ejercicios · {routine.daysAtWeek ?? "—"} días/sem
                    </span>
                    <h3 className="mt-3 text-2xl font-black tracking-tight">
                      {routine.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {routine.description ||
                        "Plan preparado por tu entrenador."}
                    </p>
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 px-1 text-xs font-bold text-slate-500">
                      ¿Qué día vas a entrenar?
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {routine.days.map((day) => (
                        <form action={startWorkoutSession} key={day.dayNumber}>
                          <input
                            name="routineId"
                            type="hidden"
                            value={routine.id}
                          />
                          <input
                            name="dayNumber"
                            type="hidden"
                            value={day.dayNumber}
                          />
                          <button
                            className="flex w-full items-center justify-between rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-slate-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-orange-400"
                            type="submit"
                          >
                            <span>Día {day.dayNumber}</span>
                            <span className="font-mono text-[10px] opacity-60">
                              {day.exerciseCount} ejercicios →
                            </span>
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
            Historial reciente
          </p>
          <h2 className="mt-1 text-2xl font-black">Últimas sesiones</h2>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-300 bg-white">
            {sessions.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Todavía no has registrado entrenamientos.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {sessions.map((session) => {
                  const complete = session.status === "completed";
                  const abandoned = session.status === "abandoned";
                  return (
                    <Link
                      className="flex items-center gap-4 px-5 py-5 transition hover:bg-orange-50/60 sm:px-7"
                      href={`/client/sessions/${session.id}`}
                      key={session.id}
                    >
                      <span
                        className={`grid size-11 place-items-center rounded-xl font-black ${
                          complete
                            ? "bg-emerald-100 text-emerald-700"
                            : abandoned
                              ? "bg-slate-200 text-slate-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {complete ? "✓" : "▶"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">
                          {session.routineName} · Día {session.dayNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateFormatter.format(new Date(session.startedAt))}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-500">
                        {sessionStatusLabel(session.status)} ·{" "}
                        {session.completedSets}/{session.totalSets}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function sessionStatusLabel(status: "in_progress" | "completed" | "abandoned") {
  return {
    in_progress: "En progreso",
    completed: "Finalizada",
    abandoned: "Abandonada",
  }[status];
}

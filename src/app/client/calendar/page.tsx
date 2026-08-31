import {
  skipScheduledWorkout,
  startScheduledWorkout,
} from "@/lib/calendar/actions";
import { getClientCalendar } from "@/lib/calendar/queries";
export default async function ClientCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; skipped?: string }>;
}) {
  const params = await searchParams;
  const data = await getClientCalendar();
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-slate-300 pb-8">
          <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-orange-700">
            Plan semanal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Calendario y adherencia
          </h1>
          <p className="mt-3 text-slate-600">
            Adherencia: {data.completed} sesiones completadas de {data.eligible}{" "}
            elegibles.
          </p>
        </header>
        {params.error || data.error ? (
          <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
            {params.error ?? data.error}
          </p>
        ) : null}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold text-slate-400">
              Sesiones completadas / elegibles
            </p>
            <p className="mt-2 text-3xl font-black">
              {data.completed} / {data.eligible}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-5">
            <p className="text-xs font-bold text-slate-500">Sets registrados</p>
            <p className="mt-2 text-3xl font-black">
              {data.completedSets} / {data.plannedSets}
            </p>
          </div>
        </div>
        <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">Próximas y recientes</h2>
          </div>
          {data.events.length === 0 ? (
            <p className="p-8 text-sm text-slate-500">
              No hay sesiones programadas en este periodo.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {data.events.map((event) => (
                <article
                  className="flex flex-wrap items-center gap-4 px-6 py-5"
                  key={event.id}
                >
                  <div className="min-w-28 font-black">{event.date}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">
                      {event.routineName} · Día {event.dayNumber}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {label(event.status)} · {event.completedSets}/
                      {event.plannedSets} sets
                    </p>
                  </div>
                  {["scheduled", "rescheduled"].includes(event.status) ? (
                    <div className="flex gap-2">
                      <form action={startScheduledWorkout}>
                        <input
                          name="scheduledWorkoutId"
                          type="hidden"
                          value={event.id}
                        />
                        <button
                          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black"
                          type="submit"
                        >
                          Entrenar
                        </button>
                      </form>
                      <form action={skipScheduledWorkout}>
                        <input
                          name="scheduledWorkoutId"
                          type="hidden"
                          value={event.id}
                        />
                        <button
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black"
                          type="submit"
                        >
                          Omitir
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function label(status: string) {
  return (
    (
      {
        scheduled: "Programada",
        completed: "Completada",
        skipped: "Omitida",
        rescheduled: "Reprogramada",
        cancelled: "Cancelada",
      } as Record<string, string>
    )[status] ?? status
  );
}

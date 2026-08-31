import { scheduleWorkout } from "@/lib/calendar/actions";
import { getTrainerRoutines } from "@/lib/routines/queries";
export default async function TrainerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const params = await searchParams;
  const { routines, error } = await getTrainerRoutines();
  const published = routines.filter((item) => item.status === "published");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-slate-300 pb-8">
          <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-orange-700">
            Plan semanal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Programar sesión
          </h1>
          <p className="mt-3 text-slate-600">
            Programa una sesión concreta de una rutina publicada. El cliente la
            verá en su calendario.
          </p>
        </header>
        {error || params.error ? (
          <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
            {error ?? params.error}
          </p>
        ) : null}
        {params.created ? (
          <p className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            Sesión programada.
          </p>
        ) : null}
        <form
          action={scheduleWorkout}
          className="grid gap-5 rounded-3xl border border-slate-300 bg-white p-6 sm:grid-cols-2"
        >
          <label className="text-sm font-bold">
            Rutina publicada
            <select
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              name="routineId"
              required
            >
              {published.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.clientName} · {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Fecha
            <input
              className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3"
              defaultValue={today}
              name="date"
              required
              type="date"
            />
          </label>
          <label className="text-sm font-bold">
            Día de la rutina
            <select
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              name="dayNumber"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <option key={day} value={day}>
                  Día {day}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              disabled={published.length === 0}
              type="submit"
            >
              Programar sesión
            </button>
          </div>
          {published.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500">
              No hay rutinas publicadas para programar.
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}

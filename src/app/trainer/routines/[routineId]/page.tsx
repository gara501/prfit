import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseVideoButton } from "@/components/exercises/ExerciseVideoButton";
import { RoutineDaysTabs } from "@/components/routines/RoutineDaysTabs";
import { RoutineVersionActions } from "@/components/routines/RoutineVersionActions";
import { getRoutineWorkspace } from "@/lib/routines/queries";
import { routineVersionLabels } from "@/lib/routines/versioning";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function RoutineDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ routineId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { routineId } = await params;
  const { error: actionError } = await searchParams;
  const { routine, error } = await getRoutineWorkspace(routineId);
  if (!routine) notFound();

  const totalSets = routine.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const exercisesByDay = new Map<
    number,
    (typeof routine.exercises)[number][]
  >();
  for (const exercise of routine.exercises) {
    const exercises = exercisesByDay.get(exercise.dayNumber) ?? [];
    exercises.push(exercise);
    exercisesByDay.set(exercise.dayNumber, exercises);
  }
  const routineDays = Array.from(
    { length: routine.daysAtWeek ?? 1 },
    (_, index) => {
      const dayNumber = index + 1;
      return {
        dayNumber,
        exerciseCount: exercisesByDay.get(dayNumber)?.length ?? 0,
      };
    },
  );

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-700"
          href="/trainer/routines"
        >
          ← Todas las rutinas
        </Link>

        {error || actionError ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error ?? actionError}
          </p>
        ) : null}

        <header className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-orange-500 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-slate-950">
                  {routineVersionLabels[routine.status]} · v
                  {routine.versionNumber}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {routine.clientName}
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
                {routine.name}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                {routine.description || "Sin descripción adicional."}
              </p>
            </div>
            <RoutineVersionActions
              routineId={routine.id}
              status={routine.status}
            />
          </div>
          <dl className="grid grid-cols-2 border-t border-slate-800 sm:grid-cols-4">
            <Summary label="Ejercicios" value={routine.exercises.length} />
            <Summary label="Series" value={totalSets} />
            <Summary label="Días / semana" value={routine.daysAtWeek ?? "—"} />
            <Summary
              label="Vigencia"
              value={`${dateFormatter.format(new Date(`${routine.startDate}T12:00:00`))}${routine.endDate ? ` — ${dateFormatter.format(new Date(`${routine.endDate}T12:00:00`))}` : ""}`}
            />
          </dl>
        </header>

        <RoutineDaysTabs days={routineDays}>
          {routineDays.map(({ dayNumber }) => {
            const dayExercises = exercisesByDay.get(dayNumber) ?? [];
            return (
              <div key={dayNumber}>
                {dayExercises.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
                    Este día todavía no tiene ejercicios definidos.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {dayExercises.map((exercise, index) => (
                      <RoutineExerciseCard
                        exercise={exercise}
                        index={index}
                        key={exercise.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </RoutineDaysTabs>
      </div>
    </main>
  );
}

function RoutineExerciseCard({
  exercise,
  index,
}: {
  exercise: NonNullable<
    Awaited<ReturnType<typeof getRoutineWorkspace>>["routine"]
  >["exercises"][number];
  index: number;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
      <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="font-mono text-3xl font-black tracking-[-0.08em] text-orange-500">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="min-w-0 truncate text-xl font-black tracking-tight">
              {exercise.exerciseName}
            </h3>
            {exercise.videoUrl ? (
              <ExerciseVideoButton
                className="text-orange-600 hover:bg-orange-50"
                exerciseName={exercise.exerciseName}
                videoUrl={exercise.videoUrl}
              />
            ) : null}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {exercise.sets.length} series programadas
          </p>
          {exercise.techniqueNotes ? (
            <p className="mt-2 text-sm leading-5 text-slate-600">
              <span className="font-bold text-slate-800">En este plan: </span>
              {exercise.techniqueNotes}
            </p>
          ) : null}
          {exercise.clientExerciseNote ? (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              <span className="font-bold text-slate-800">
                Nota permanente:{" "}
              </span>
              {exercise.clientExerciseNote}
            </p>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-3">Serie</th>
              <th className="px-5 py-3">Repeticiones</th>
              <th className="px-5 py-3">Peso</th>
              <th className="px-6 py-3 text-right">Descanso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exercise.sets.map((set) => (
              <tr key={set.id}>
                <td className="px-6 py-4 font-mono font-black text-slate-400">
                  {set.setNumber}
                </td>
                <td className="px-5 py-4 font-black">{set.reps ?? "—"}</td>
                <td className="px-5 py-4 font-black">
                  {set.weight === null ? "—" : `${set.weight} kg`}
                </td>
                <td className="px-6 py-4 text-right font-black">
                  {set.restSeconds === null ? "—" : `${set.restSeconds} s`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-r border-slate-800 px-6 py-4 last:border-r-0">
      <dt className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-black text-white">{value}</dd>
    </div>
  );
}

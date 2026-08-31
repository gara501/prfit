"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ExerciseCreatePanel } from "@/components/exercises/ExerciseCreateForm";
import { ExerciseVideoButton } from "@/components/exercises/ExerciseVideoButton";
import {
  type RoutineActionState,
  saveRoutineDraft,
} from "@/lib/routines/actions";
import type {
  ExerciseOption,
  RoutineClient,
  RoutineDetail,
} from "@/lib/routines/types";

type EditableSet = {
  key: string;
  repsMin: string;
  repsMax: string;
  restSeconds: string;
  weight: string;
  targetEffort: string;
  setType: "warmup" | "ramp_up" | "working" | "drop_set" | "amrap";
  tempo: string;
  isOptional: boolean;
};

type EditableExercise = {
  key: string;
  dayNumber: number;
  exerciseId: string;
  techniqueNotes: string;
  clientExerciseNote: string;
  sets: EditableSet[];
};

const initialActionState: RoutineActionState = {
  status: "idle",
  message: "",
};

const emptySet = (key: string): EditableSet => ({
  key,
  repsMin: "8",
  repsMax: "10",
  restSeconds: "60",
  weight: "",
  targetEffort: "",
  setType: "working",
  tempo: "",
  isOptional: false,
});

function getInitialExercises(
  routine: RoutineDetail | null,
): EditableExercise[] {
  if (!routine) return [];
  return routine.exercises.map((exercise) => ({
    key: exercise.id,
    dayNumber: exercise.dayNumber,
    exerciseId: exercise.exerciseId,
    techniqueNotes: exercise.techniqueNotes,
    clientExerciseNote: exercise.clientExerciseNote,
    sets: exercise.sets.map((set) => ({
      key: set.id,
      repsMin: set.repsMin?.toString() ?? set.reps?.toString() ?? "",
      repsMax: set.repsMax?.toString() ?? set.reps?.toString() ?? "",
      restSeconds: set.restSeconds?.toString() ?? "",
      weight: set.weight?.toString() ?? "",
      targetEffort:
        routine.effortMetric === "rir"
          ? (set.targetRir?.toString() ?? "")
          : (set.targetRpe?.toString() ?? ""),
      setType: set.setType,
      tempo: set.tempo,
      isOptional: set.isOptional,
    })),
  }));
}

export function RoutineEditor({
  clients,
  defaultClientId,
  exerciseOptions,
  routine,
}: {
  clients: RoutineClient[];
  defaultClientId?: string;
  exerciseOptions: ExerciseOption[];
  routine: RoutineDetail | null;
}) {
  const [state, formAction, isPending] = useActionState(
    saveRoutineDraft,
    initialActionState,
  );
  const [exercises, setExercises] = useState(() =>
    getInitialExercises(routine),
  );
  const [daysAtWeek, setDaysAtWeek] = useState(
    routine ? (routine.daysAtWeek ?? 1) : 3,
  );
  const [effortMetric, setEffortMetric] = useState<"rir" | "rpe">(
    routine?.effortMetric ?? "rir",
  );
  const [activeDay, setActiveDay] = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const visibleExercises = exercises.filter(
    (exercise) => exercise.dayNumber === activeDay,
  );
  const missingDays = Array.from(
    { length: daysAtWeek },
    (_, index) => index + 1,
  ).filter((day) => !exercises.some((exercise) => exercise.dayNumber === day));

  const serializedExercises = JSON.stringify(
    exercises
      .filter((exercise) => exercise.dayNumber <= daysAtWeek)
      .map((exercise) => ({
        day_number: exercise.dayNumber,
        exercise_id: exercise.exerciseId,
        technique_notes: exercise.techniqueNotes,
        client_exercise_note: exercise.clientExerciseNote,
        sets: exercise.sets.map((set) => ({
          reps_min: set.repsMin,
          reps_max: set.repsMax,
          rest_seconds: set.restSeconds,
          weight: set.weight,
          target_rir: effortMetric === "rir" ? set.targetEffort : "",
          target_rpe: effortMetric === "rpe" ? set.targetEffort : "",
          set_type: set.setType,
          tempo: set.tempo,
          is_optional: set.isOptional,
        })),
      })),
  );

  const addExercise = () => {
    const firstOption = exerciseOptions[0];
    if (!firstOption) return;
    const key = crypto.randomUUID();
    setExercises((current) => [
      ...current,
      {
        key,
        dayNumber: activeDay,
        exerciseId: firstOption.id,
        techniqueNotes: "",
        clientExerciseNote: "",
        sets: [emptySet(`${key}-set`)],
      },
    ]);
  };

  const replicateActiveDay = () => {
    if (visibleExercises.length === 0 || daysAtWeek < 2) return;
    if (
      !window.confirm(
        `Se reemplazarán los ejercicios de los otros ${daysAtWeek - 1} días. ¿Continuar?`,
      )
    ) {
      return;
    }
    const copies = Array.from({ length: daysAtWeek }, (_, index) => index + 1)
      .filter((day) => day !== activeDay)
      .flatMap((day) =>
        visibleExercises.map((exercise) => ({
          ...exercise,
          key: crypto.randomUUID(),
          dayNumber: day,
          sets: exercise.sets.map((set) => ({
            ...set,
            key: crypto.randomUUID(),
          })),
        })),
      );
    setExercises((current) => [
      ...current.filter(
        (exercise) =>
          exercise.dayNumber === activeDay || exercise.dayNumber > daysAtWeek,
      ),
      ...copies,
    ]);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <form action={formAction} className="mx-auto max-w-7xl">
        <input name="routineId" type="hidden" value={routine?.id ?? ""} />
        <input name="exercises" type="hidden" value={serializedExercises} />

        <header className="mb-8 flex flex-col gap-5 border-b border-slate-300 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-700 hover:text-orange-900"
              href={
                routine
                  ? `/trainer/routines/${routine.id}`
                  : "/trainer/routines"
              }
            >
              ← Volver a rutinas
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {routine ? "Editar borrador" : "Diseñar plan semanal"}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Define el bloque de trabajo completo. Todos los ejercicios y sus
              series se guardan juntos en un borrador antes de publicarlo.
            </p>
          </div>
          <button
            className="rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
            disabled={
              isPending || clients.length === 0 || missingDays.length > 0
            }
            type="submit"
          >
            {isPending ? "Guardando borrador…" : "Guardar borrador"}
          </button>
        </header>

        {state.message ? (
          <p
            aria-live="polite"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800"
          >
            {state.message}
          </p>
        ) : null}

        <div className="grid items-start gap-8 xl:grid-cols-[21rem_minmax(0,1fr)]">
          <aside className="space-y-5 xl:sticky xl:top-28">
            <section className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                01 / Datos del plan
              </p>
              <div className="mt-5 space-y-4">
                <Field htmlFor="routine-name" label="Nombre">
                  <input
                    className={inputClass}
                    defaultValue={routine?.name ?? ""}
                    id="routine-name"
                    maxLength={120}
                    name="name"
                    placeholder="Fuerza — bloque 1"
                    required
                  />
                </Field>
                <Field htmlFor="routine-client" label="Deportista">
                  <select
                    className={inputClass}
                    defaultValue={routine?.clientId ?? defaultClientId ?? ""}
                    id="routine-client"
                    name="clientId"
                    required
                  >
                    <option disabled value="">
                      Selecciona un cliente
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {`${client.firstName} ${client.lastName}`.trim()}
                      </option>
                    ))}
                  </select>
                </Field>
                {clients.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    Primero necesitas un cliente activo. Puedes vincularlo en{" "}
                    <Link
                      className="font-bold underline"
                      href="/trainer/clients"
                    >
                      Clientes
                    </Link>
                    .
                  </p>
                ) : null}
                <Field htmlFor="routine-description" label="Descripción">
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    defaultValue={routine?.description ?? ""}
                    id="routine-description"
                    maxLength={2000}
                    name="description"
                    placeholder="Objetivo, progresión y observaciones…"
                  />
                </Field>
                <Field htmlFor="routine-effort" label="Escala de esfuerzo">
                  <select
                    className={inputClass}
                    id="routine-effort"
                    name="effortMetric"
                    onChange={(event) =>
                      setEffortMetric(event.target.value as "rir" | "rpe")
                    }
                    value={effortMetric}
                  >
                    <option value="rir">RIR · repeticiones en reserva</option>
                    <option value="rpe">RPE · esfuerzo percibido</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field htmlFor="routine-start" label="Inicio">
                    <input
                      className={inputClass}
                      defaultValue={routine?.startDate ?? today}
                      id="routine-start"
                      name="startDate"
                      required
                      type="date"
                    />
                  </Field>
                  <Field htmlFor="routine-end" label="Final">
                    <input
                      className={inputClass}
                      defaultValue={routine?.endDate ?? ""}
                      id="routine-end"
                      name="endDate"
                      type="date"
                    />
                  </Field>
                </div>
                <Field htmlFor="routine-days" label="Días por semana">
                  <input
                    className={inputClass}
                    value={daysAtWeek}
                    id="routine-days"
                    max={7}
                    min={1}
                    name="daysAtWeek"
                    onChange={(event) => {
                      const nextDays = Math.min(
                        7,
                        Math.max(1, Number(event.target.value) || 1),
                      );
                      setDaysAtWeek(nextDays);
                      setActiveDay((current) => Math.min(current, nextDays));
                    }}
                    required
                    type="number"
                  />
                </Field>
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                  Guardar no cambia la rutina del cliente. Publica este borrador
                  desde su detalle cuando esté listo.
                </p>
              </div>
            </section>

            <ExerciseCreatePanel formId="routine-exercise-create-form" />
          </aside>

          <section>
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-300 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                    Distribución semanal
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cada día es una rutina dentro de este plan.
                  </p>
                </div>
                <button
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black transition hover:border-orange-500 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={visibleExercises.length === 0 || daysAtWeek < 2}
                  onClick={replicateActiveDay}
                  type="button"
                >
                  Replicar Día {activeDay} en los demás
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto p-3" role="tablist">
                {Array.from(
                  { length: daysAtWeek },
                  (_, index) => index + 1,
                ).map((day) => {
                  const count = exercises.filter(
                    (exercise) => exercise.dayNumber === day,
                  ).length;
                  return (
                    <button
                      aria-selected={activeDay === day}
                      className={`min-w-24 rounded-xl px-4 py-3 text-left transition ${
                        activeDay === day
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-orange-100"
                      }`}
                      key={day}
                      onClick={() => setActiveDay(day)}
                      role="tab"
                      type="button"
                    >
                      <span className="block text-sm font-black">
                        Día {day}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-bold opacity-60">
                        {count} ejercicio{count === 1 ? "" : "s"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {missingDays.length > 0 ? (
                <p className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                  Agrega al menos un ejercicio en Día {missingDays.join(", ")}{" "}
                  para poder guardar el plan.
                </p>
              ) : null}
            </div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                  02 / Bloque de trabajo
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Día {activeDay} · {visibleExercises.length} ejercicio
                  {visibleExercises.length === 1 ? "" : "s"}
                </h2>
              </div>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black transition hover:border-slate-950 hover:bg-slate-950 hover:text-white disabled:opacity-40"
                disabled={exerciseOptions.length === 0}
                onClick={addExercise}
                type="button"
              >
                + Agregar ejercicio
              </button>
            </div>

            {visibleExercises.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-400 bg-white/60 p-8 text-center">
                <div>
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-950 text-2xl text-white">
                    +
                  </span>
                  <h3 className="mt-4 text-xl font-black">
                    Arma el primer bloque
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Crea un ejercicio en el catálogo rápido si está vacío y
                    agrégalo a la rutina con sus series objetivo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleExercises.map((exercise, exerciseIndex) => (
                  <ExerciseCard
                    effortMetric={effortMetric}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    key={exercise.key}
                    options={exerciseOptions}
                    setExercises={setExercises}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </form>
      <form id="routine-exercise-create-form" />
    </div>
  );
}

function ExerciseCard({
  effortMetric,
  exercise,
  exerciseIndex,
  options,
  setExercises,
}: {
  effortMetric: "rir" | "rpe";
  exercise: EditableExercise;
  exerciseIndex: number;
  options: ExerciseOption[];
  setExercises: React.Dispatch<React.SetStateAction<EditableExercise[]>>;
}) {
  const selectedOption = options.find(
    (option) => option.id === exercise.exerciseId,
  );
  const updateExercise = (
    update: (item: EditableExercise) => EditableExercise,
  ) =>
    setExercises((current) =>
      current.map((item) => (item.key === exercise.key ? update(item) : item)),
    );
  const updateSet = (setKey: string, patch: Partial<EditableSet>) =>
    updateExercise((item) => ({
      ...item,
      sets: item.sets.map((candidate) =>
        candidate.key === setKey ? { ...candidate, ...patch } : candidate,
      ),
    }));

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,0.8)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
        <span className="grid size-9 place-items-center rounded-xl bg-orange-500 font-mono text-sm font-black text-slate-950">
          {String(exerciseIndex + 1).padStart(2, "0")}
        </span>
        <select
          aria-label={`Ejercicio ${exerciseIndex + 1}`}
          className="min-w-48 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          onChange={(event) =>
            updateExercise((item) => ({
              ...item,
              exerciseId: event.target.value,
            }))
          }
          value={exercise.exerciseId}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {selectedOption?.videoUrl ? (
          <ExerciseVideoButton
            className="text-orange-600 hover:bg-orange-50"
            exerciseName={selectedOption.name}
            videoUrl={selectedOption.videoUrl}
          />
        ) : null}
        <button
          className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
          onClick={() =>
            setExercises((current) =>
              current.filter((item) => item.key !== exercise.key),
            )
          }
          type="button"
        >
          Quitar
        </button>
      </div>

      <div className="p-5 sm:p-7">
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-xs font-bold text-slate-600">
            Indicaciones de esta rutina
            <textarea
              className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              maxLength={2000}
              onChange={(event) =>
                updateExercise((item) => ({
                  ...item,
                  techniqueNotes: event.target.value,
                }))
              }
              placeholder="Técnica, agarre, recorrido o prioridad para este bloque."
              value={exercise.techniqueNotes}
            />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            Nota permanente para este cliente
            <textarea
              className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              maxLength={2000}
              onChange={(event) =>
                updateExercise((item) => ({
                  ...item,
                  clientExerciseNote: event.target.value,
                }))
              }
              placeholder="Ej.: evitar rango profundo por ahora."
              value={exercise.clientExerciseNote}
            />
          </label>
        </div>
        <div className="mb-3 hidden grid-cols-[3rem_repeat(4,minmax(0,1fr))_2.5rem] gap-3 px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
          <span>Serie</span>
          <span>Reps mín.</span>
          <span>Reps máx.</span>
          <span>Peso kg</span>
          <span>Descanso s</span>
          <span />
        </div>
        <div className="space-y-2">
          {exercise.sets.map((set, setIndex) => (
            <div
              className="grid grid-cols-[2.5rem_repeat(4,minmax(0,1fr))_2.5rem] items-center gap-2 sm:grid-cols-[3rem_repeat(4,minmax(0,1fr))_2.5rem] sm:gap-3"
              key={set.key}
            >
              <span className="font-mono text-sm font-black text-slate-400">
                {setIndex + 1}
              </span>
              <SetInput
                label={`Mínimo de repeticiones, serie ${setIndex + 1}`}
                min="1"
                value={set.repsMin}
                onChange={(value) => updateSet(set.key, { repsMin: value })}
              />
              <SetInput
                label={`Máximo de repeticiones, serie ${setIndex + 1}`}
                min="1"
                value={set.repsMax}
                onChange={(value) => updateSet(set.key, { repsMax: value })}
              />
              <SetInput
                label="Peso en kilogramos"
                step="0.25"
                value={set.weight}
                onChange={(value) =>
                  updateExercise((item) => ({
                    ...item,
                    sets: item.sets.map((candidate) =>
                      candidate.key === set.key
                        ? { ...candidate, weight: value }
                        : candidate,
                    ),
                  }))
                }
              />
              <SetInput
                label="Descanso en segundos"
                value={set.restSeconds}
                onChange={(value) =>
                  updateExercise((item) => ({
                    ...item,
                    sets: item.sets.map((candidate) =>
                      candidate.key === set.key
                        ? { ...candidate, restSeconds: value }
                        : candidate,
                    ),
                  }))
                }
              />
              <button
                aria-label={`Eliminar serie ${setIndex + 1}`}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                disabled={exercise.sets.length === 1}
                onClick={() =>
                  updateExercise((item) => ({
                    ...item,
                    sets: item.sets.filter(
                      (candidate) => candidate.key !== set.key,
                    ),
                  }))
                }
                type="button"
              >
                ×
              </button>
              <div className="col-span-full grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-4">
                <label className="text-xs font-bold text-slate-600">
                  Tipo de serie
                  <select
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    onChange={(event) =>
                      updateSet(set.key, {
                        setType: event.target.value as EditableSet["setType"],
                      })
                    }
                    value={set.setType}
                  >
                    <option value="warmup">Calentamiento</option>
                    <option value="ramp_up">Aproximación</option>
                    <option value="working">Trabajo</option>
                    <option value="drop_set">Drop set</option>
                    <option value="amrap">AMRAP</option>
                  </select>
                </label>
                <SetInput
                  label={`${effortMetric.toUpperCase()} objetivo, serie ${setIndex + 1}`}
                  min={effortMetric === "rir" ? "0" : "1"}
                  value={set.targetEffort}
                  onChange={(value) =>
                    updateSet(set.key, { targetEffort: value })
                  }
                />
                <label className="text-xs font-bold text-slate-600">
                  Tempo
                  <input
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    maxLength={16}
                    onChange={(event) =>
                      updateSet(set.key, { tempo: event.target.value })
                    }
                    placeholder="3-1-X-0"
                    value={set.tempo}
                  />
                </label>
                <label className="mt-5 flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  <input
                    checked={set.isOptional}
                    className="size-4 accent-orange-500"
                    onChange={(event) =>
                      updateSet(set.key, { isOptional: event.target.checked })
                    }
                    type="checkbox"
                  />
                  Serie opcional
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-black text-slate-600 hover:border-orange-400 hover:text-orange-700"
          onClick={() =>
            updateExercise((item) => ({
              ...item,
              sets: [
                ...item.sets,
                emptySet(`${item.key}-${crypto.randomUUID()}`),
              ],
            }))
          }
          type="button"
        >
          + Añadir serie
        </button>
      </div>
    </article>
  );
}

function SetInput({
  label,
  min = "0",
  value,
  step = "1",
  onChange,
}: {
  label: string;
  min?: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label={label}
      className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-center text-sm font-bold outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 sm:px-3"
      min={min}
      onChange={(event) => onChange(event.target.value)}
      step={step}
      type="number"
      value={value}
    />
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label
        className="mb-1.5 block text-xs font-bold text-slate-600"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

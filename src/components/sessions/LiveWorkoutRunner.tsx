"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Timer,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExerciseVideoButton } from "@/components/exercises/ExerciseVideoButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getTrainingMethod } from "@/lib/routines/training-methods";
import type {
  LiveWorkoutExercise,
  LiveWorkoutSession,
  LiveWorkoutSet,
  PreviousSetPerformance,
} from "@/lib/sessions/types";
import { createClient } from "@/lib/supabase/client";
import {
  canCompleteSession,
  isSessionEditable,
} from "@/lib/training/session-lifecycle";
import { effortBounds, isValidEffort } from "@/lib/training/set-prescription";
import { cn } from "@/lib/utils";

type EditableField =
  | "reps"
  | "weight"
  | "actualEffort"
  | "clientNotes"
  | "deviationReason"
  | "completed";

type WorkoutSetEntry = {
  exercise: LiveWorkoutExercise;
  exerciseIndex: number;
  set: LiveWorkoutSet;
  setIndex: number;
};

type RestTimerState = {
  setId: string;
  exerciseName: string;
  endsAt: number;
};

type CompletionFeedback = {
  energy: string;
  sessionRpe: string;
  sorenessLevel: string;
  sorenessDescription: string;
  clientNote: string;
};

export function LiveWorkoutRunner({
  initialSession,
}: {
  initialSession: LiveWorkoutSession;
}) {
  const [supabase] = useState(createClient);
  const router = useRouter();
  const [exercises, setExercises] = useState(initialSession.exercises);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const [activeSetId, setActiveSetId] = useState(
    () =>
      findFirstIncompleteSetId(initialSession.exercises) ??
      initialSession.exercises.at(-1)?.sets.at(-1)?.id ??
      "",
  );
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [restAnnouncement, setRestAnnouncement] = useState("");
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const pendingSaveCounts = useRef(new Map<string, number>());
  const persistedValues = useRef(
    new Map(
      initialSession.exercises.flatMap((exercise) =>
        exercise.sets.map((set) => [
          set.id,
          {
            reps: set.reps,
            weight: set.weight,
            actualEffort: set.actualEffort,
            clientNotes: set.clientNotes,
            deviationReason: set.deviationReason,
            completed: set.completed,
          },
        ]),
      ),
    ),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionStartedAt = new Date(initialSession.startedAt).getTime();
  const isReadOnly = !isSessionEditable(initialSession.status);
  const sessionEndedAt = initialSession.endedAt
    ? new Date(initialSession.endedAt).getTime()
    : now;
  const elapsedSeconds = Math.max(
    0,
    initialSession.durationSeconds ??
      Math.floor((sessionEndedAt - sessionStartedAt) / 1000),
  );
  const setEntries = flattenWorkoutSets(exercises);
  const allSets = setEntries.map((entry) => entry.set);
  const completedSets = allSets.filter((set) => set.completed).length;
  const totalSets = allSets.length;
  const progress = totalSets === 0 ? 0 : (completedSets / totalSets) * 100;
  const allSetsComplete = totalSets > 0 && completedSets === totalSets;
  const isFinished = canCompleteSession(
    initialSession.status,
    completedSets,
    totalSets,
  );
  const activeEntry =
    setEntries.find((entry) => entry.set.id === activeSetId) ??
    setEntries.find((entry) => !entry.set.completed) ??
    setEntries.at(-1);
  const restSeconds = restTimer
    ? Math.max(0, Math.ceil((restTimer.endsAt - now) / 1000))
    : null;

  useEffect(() => {
    if (restTimer && restSeconds === 0) {
      setRestTimer(null);
      setRestAnnouncement("Descanso finalizado.");
    }
  }, [restSeconds, restTimer]);

  const updateLocalSet = (
    setId: string,
    patch: Partial<Pick<LiveWorkoutSet, EditableField>>,
  ) => {
    setExercises((current) =>
      current.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.id === setId ? { ...set, ...patch } : set,
        ),
      })),
    );
  };

  const persistSet = async (
    setId: string,
    patch: Partial<Pick<LiveWorkoutSet, EditableField>>,
  ) => {
    if (isReadOnly) return;
    const previous = persistedValues.current.get(setId);
    if (!previous) return;

    pendingSaveCounts.current.set(
      setId,
      (pendingSaveCounts.current.get(setId) ?? 0) + 1,
    );
    setSavingIds((current) => new Set(current).add(setId));
    setError("");
    const databasePatch: {
      reps?: number | null;
      weight?: number | null;
      completed?: boolean;
      actual_rir?: number | null;
      actual_rpe?: number | null;
      client_notes?: string | null;
      deviation_reason?: string | null;
    } = {};
    if (patch.reps !== undefined) databasePatch.reps = patch.reps;
    if (patch.weight !== undefined) databasePatch.weight = patch.weight;
    if (patch.completed !== undefined)
      databasePatch.completed = patch.completed;
    if (patch.actualEffort !== undefined) {
      databasePatch[
        initialSession.effortMetric === "rpe" ? "actual_rpe" : "actual_rir"
      ] = patch.actualEffort;
    }
    if (patch.clientNotes !== undefined) {
      databasePatch.client_notes = patch.clientNotes || null;
    }
    if (patch.deviationReason !== undefined) {
      databasePatch.deviation_reason = patch.deviationReason || null;
    }

    const { error: updateError } = await supabase
      .from("workout_session_sets")
      .update(databasePatch)
      .eq("id", setId)
      .eq("workout_session_id", initialSession.id)
      .select("id")
      .single();

    if (updateError) {
      const rollback = Object.fromEntries(
        Object.keys(patch).map((field) => [
          field,
          previous[field as EditableField],
        ]),
      ) as Partial<Pick<LiveWorkoutSet, EditableField>>;
      updateLocalSet(setId, rollback);
      if (patch.completed === true) {
        setActiveSetId(setId);
        setRestTimer((current) => (current?.setId === setId ? null : current));
      }
      setError(
        "No pudimos guardar el último cambio. Restauramos el valor anterior.",
      );
    } else {
      persistedValues.current.set(setId, {
        ...(persistedValues.current.get(setId) ?? previous),
        ...patch,
      });
    }

    const remainingSaves = (pendingSaveCounts.current.get(setId) ?? 1) - 1;
    if (remainingSaves > 0) {
      pendingSaveCounts.current.set(setId, remainingSaves);
    } else {
      pendingSaveCounts.current.delete(setId);
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(setId);
        return next;
      });
    }
  };

  const persistValue = (
    setId: string,
    field: Extract<EditableField, "reps" | "weight" | "actualEffort">,
    value: number | null,
  ) => {
    if (field === "reps" && value !== null && value <= 0) return;
    if (field === "weight" && value !== null && value < 0) return;
    if (
      field === "actualEffort" &&
      value !== null &&
      !isValidEffort(initialSession.effortMetric, value)
    ) {
      return;
    }
    void persistSet(setId, { [field]: value });
  };

  const toggleSet = (entry: WorkoutSetEntry) => {
    if (isReadOnly) return;
    const { set, exercise } = entry;
    if (!set.completed && hasInvalidValues(set, initialSession.effortMetric)) {
      setActiveSetId(set.id);
      setError(
        "Revisa las repeticiones, el peso y el esfuerzo antes de completar la serie.",
      );
      return;
    }

    const completed = !set.completed;
    updateLocalSet(set.id, { completed });
    if (completed) {
      const currentIndex = setEntries.findIndex(
        (candidate) => candidate.set.id === set.id,
      );
      const nextEntry = [
        ...setEntries.slice(currentIndex + 1),
        ...setEntries.slice(0, currentIndex),
      ].find((candidate) => !candidate.set.completed);
      setActiveSetId(nextEntry?.set.id ?? set.id);
      if (set.restSeconds && set.restSeconds > 0) {
        setRestTimer({
          setId: set.id,
          exerciseName: exercise.name,
          endsAt: Date.now() + set.restSeconds * 1000,
        });
        setRestAnnouncement(
          `Descanso iniciado: ${formatCompactDuration(set.restSeconds)}.`,
        );
      }
    } else {
      setActiveSetId(set.id);
      if (restTimer?.setId === set.id) setRestTimer(null);
    }
    void persistSet(set.id, { completed });
  };

  const completeSession = async (feedback: CompletionFeedback) => {
    setIsClosing(true);
    setError("");
    const { error: completionError } = await supabase.rpc(
      "complete_workout_session",
      {
        p_session_id: initialSession.id,
        p_energy: toNullableInteger(feedback.energy),
        p_session_rpe: toNullableInteger(feedback.sessionRpe),
        p_soreness_level: toNullableInteger(feedback.sorenessLevel),
        p_soreness_description: feedback.sorenessDescription,
        p_client_note: feedback.clientNote,
      },
    );
    if (completionError) {
      setError(completionError.message);
      setIsClosing(false);
      return;
    }
    router.push("/client/sessions?completed=1");
    router.refresh();
  };

  const abandonSession = async () => {
    if (
      !window.confirm(
        "¿Abandonar esta sesión? No podrás editar sus series después.",
      )
    ) {
      return;
    }
    setIsClosing(true);
    setError("");
    const { error: abandonError } = await supabase.rpc(
      "abandon_workout_session",
      { p_session_id: initialSession.id },
    );
    if (abandonError) {
      setError(abandonError.message);
      setIsClosing(false);
      return;
    }
    router.push("/client/sessions?abandoned=1");
    router.refresh();
  };

  if (totalSets === 0) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-surface-inverse px-4 py-12 text-surface-inverse-foreground sm:px-8">
        <section className="mx-auto max-w-xl rounded-xl border border-border-strong/30 bg-card p-6 text-card-foreground sm:p-8">
          <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
            Sesión sin series
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            No hay ejercicios para registrar
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esta sesión no contiene series ejecutables.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/client/sessions"
          >
            Volver a mis sesiones
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-inverse pb-44 text-surface-inverse-foreground">
      <header className="border-b border-border-strong/30 px-4 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:text-surface-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse"
              href="/client/sessions"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Mis sesiones
            </Link>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tabular-nums text-surface-inverse-foreground">
              <Clock3
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <span className="sr-only">Tiempo de sesión:</span>
              <span aria-hidden="true">{formatDuration(elapsedSeconds)}</span>
            </div>
            {!isReadOnly ? (
              <button
                className="min-h-11 rounded-lg px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-60"
                disabled={isClosing}
                onClick={() => void abandonSession()}
                type="button"
              >
                Abandonar
              </button>
            ) : (
              <span className="rounded-lg border border-border-strong/30 px-3 py-2 text-xs font-bold text-muted-foreground">
                {sessionStatusLabel(initialSession.status)}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
                Día {initialSession.dayNumber} · Entrenamiento en curso
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {initialSession.routineName}
              </h1>
            </div>
            <p className="font-mono text-sm font-bold tabular-nums text-primary">
              {completedSets} de {totalSets} series
            </p>
          </div>

          <div
            aria-label={`${completedSets} de ${totalSets} series completadas`}
            aria-valuemax={totalSets}
            aria-valuemin={0}
            aria-valuenow={completedSets}
            className="mt-5 h-2 overflow-hidden rounded-full bg-muted-foreground/25"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8">
        {error ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Cambio no guardado</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {initialSession.historyUnavailable ? (
          <p className="text-sm text-muted-foreground">
            El registro anterior no está disponible. Puedes continuar con la
            sesión.
          </p>
        ) : null}

        {activeEntry ? (
          <CurrentSetWorkspace
            entry={activeEntry}
            effortMetric={initialSession.effortMetric}
            readOnly={isReadOnly}
            onChange={(field, value) =>
              updateLocalSet(activeEntry.set.id, { [field]: value })
            }
            onPersist={(field, value) =>
              persistValue(activeEntry.set.id, field, value)
            }
            onTextChange={(field, value) =>
              updateLocalSet(activeEntry.set.id, { [field]: value })
            }
            onTextPersist={(field, value) =>
              void persistSet(activeEntry.set.id, { [field]: value })
            }
            restSeconds={restSeconds}
            restTimer={restTimer}
          />
        ) : null}

        <section aria-labelledby="workout-queue-title">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
                Sesión
              </p>
              <h2 className="mt-1 text-xl font-bold" id="workout-queue-title">
                Series programadas
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona una serie para editarla
            </p>
          </div>
          <div className="divide-y divide-border-strong/25 border-y border-border-strong/25">
            {exercises.map((exercise, exerciseIndex) => (
              <ExerciseSection
                activeSetId={activeEntry?.set.id ?? ""}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                key={exercise.blockId}
                onSelect={setActiveSetId}
                onToggle={toggleSet}
                readOnly={isReadOnly}
                savingIds={savingIds}
              />
            ))}
          </div>
        </section>

        {allSetsComplete ? (
          <section className="rounded-xl border border-success/40 bg-success/10 p-6 sm:p-8">
            <p className="font-mono text-label font-bold uppercase tracking-label text-success">
              Sesión completa
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Todas las series están completadas
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {savingIds.size > 0
                ? "Guardando la última serie…"
                : `${totalSets} series registradas en ${formatDuration(elapsedSeconds)}.`}
            </p>
          </section>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {restAnnouncement}
      </p>

      <MobileActionDock
        activeEntry={activeEntry}
        error={error}
        effortMetric={initialSession.effortMetric}
        isClosing={isClosing}
        isFinished={isFinished}
        onComplete={() => setIsCompletionOpen(true)}
        onToggle={toggleSet}
        restSeconds={restSeconds}
        savingIds={savingIds}
        status={initialSession.status}
      />
      {isCompletionOpen ? (
        <CompletionPanel
          isSubmitting={isClosing}
          onCancel={() => setIsCompletionOpen(false)}
          onSubmit={completeSession}
        />
      ) : null}
    </main>
  );
}

function CurrentSetWorkspace({
  entry,
  effortMetric,
  readOnly,
  restTimer,
  restSeconds,
  onChange,
  onPersist,
  onTextChange,
  onTextPersist,
}: {
  entry: WorkoutSetEntry;
  effortMetric: "rir" | "rpe";
  readOnly: boolean;
  restTimer: RestTimerState | null;
  restSeconds: number | null;
  onChange: (
    field: Extract<EditableField, "reps" | "weight" | "actualEffort">,
    value: number | null,
  ) => void;
  onPersist: (
    field: Extract<EditableField, "reps" | "weight" | "actualEffort">,
    value: number | null,
  ) => void;
  onTextChange: (
    field: Extract<EditableField, "clientNotes" | "deviationReason">,
    value: string,
  ) => void;
  onTextPersist: (
    field: Extract<EditableField, "clientNotes" | "deviationReason">,
    value: string,
  ) => void;
}) {
  const { exercise, exerciseIndex, set, setIndex } = entry;
  return (
    <section
      aria-labelledby="current-exercise-name"
      className="rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono text-label font-bold uppercase tracking-label text-primary">
            Ejercicio {exerciseIndex + 1} · Serie {setIndex + 1} de{" "}
            {exercise.sets.length}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <h2
              className="min-w-0 text-2xl font-bold tracking-tight sm:text-3xl"
              id="current-exercise-name"
            >
              {exercise.name}
            </h2>
            {exercise.videoUrl ? (
              <ExerciseVideoButton
                className="text-primary hover:bg-primary/15"
                exerciseName={exercise.name}
                videoUrl={exercise.videoUrl}
              />
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold",
            set.completed
              ? "border-success/35 bg-success/10 text-success"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {set.completed ? (
            <Check aria-hidden="true" className="size-4" />
          ) : null}
          {set.completed ? "Completada" : `Serie ${set.setNumber}`}
        </span>
      </div>

      <PreviousPerformance performance={set.previousPerformance} />

      <div className="mt-5 rounded-lg border border-border bg-muted/60 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
            Prescripción
          </span>
          <span className="text-sm font-bold text-foreground">
            {formatPlannedSet(set)}
          </span>
        </div>
        {(exercise.techniqueNotes || exercise.clientExerciseNote) && (
          <div className="mt-3 grid gap-2 border-t border-border pt-3 text-sm leading-5 text-muted-foreground sm:grid-cols-2">
            {exercise.techniqueNotes ? (
              <p>
                <span className="font-bold text-foreground">
                  En esta rutina:{" "}
                </span>
                {exercise.techniqueNotes}
              </p>
            ) : null}
            {exercise.clientExerciseNote ? (
              <p>
                <span className="font-bold text-foreground">
                  Tu indicación:{" "}
                </span>
                {exercise.clientExerciseNote}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <WorkoutNumberInput
          field="reps"
          label="Repeticiones"
          disabled={readOnly}
          onChange={(value) => onChange("reps", value)}
          onPersist={(value) => onPersist("reps", value)}
          setId={set.id}
          step="1"
          value={set.reps}
        />
        <WorkoutNumberInput
          field="weight"
          label="Peso"
          disabled={readOnly}
          onChange={(value) => onChange("weight", value)}
          onPersist={(value) => onPersist("weight", value)}
          setId={set.id}
          step="0.25"
          unit="kg"
          value={set.weight}
        />
        <WorkoutNumberInput
          field="actualEffort"
          label={effortMetric.toUpperCase()}
          disabled={readOnly}
          min={effortBounds(effortMetric).min}
          onChange={(value) => onChange("actualEffort", value)}
          onPersist={(value) => onPersist("actualEffort", value)}
          setId={set.id}
          step="1"
          value={set.actualEffort}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <WorkoutTextArea
          label="Nota de la serie"
          disabled={readOnly}
          maxLength={2000}
          onChange={(value) => onTextChange("clientNotes", value)}
          onPersist={(value) => onTextPersist("clientNotes", value)}
          placeholder="Opcional"
          value={set.clientNotes}
        />
        <WorkoutTextArea
          label="Motivo de ajuste"
          disabled={readOnly}
          maxLength={500}
          onChange={(value) => onTextChange("deviationReason", value)}
          onPersist={(value) => onTextPersist("deviationReason", value)}
          placeholder="Opcional"
          value={set.deviationReason}
        />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {restTimer && restSeconds !== null ? (
          <div
            aria-label={`Descanso restante: ${formatCompactDuration(restSeconds)}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-warning"
            role="timer"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Timer aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">
                Descanso tras {restTimer.exerciseName}
              </span>
            </span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {formatCompactDuration(restSeconds)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer aria-hidden="true" className="size-4" />
            Descanso pautado: {formatRest(set.restSeconds)}
          </div>
        )}
      </div>
    </section>
  );
}

function PreviousPerformance({
  performance,
}: {
  performance: PreviousSetPerformance | null;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-muted px-4 py-3">
      <span className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
        Registro anterior
      </span>
      <span className="text-sm font-bold tabular-nums text-foreground">
        {performance ? formatPerformance(performance) : "Sin registro anterior"}
      </span>
    </div>
  );
}

function WorkoutNumberInput({
  field,
  label,
  disabled = false,
  setId,
  value,
  step,
  unit,
  min = 0,
  onChange,
  onPersist,
}: {
  field: "reps" | "weight" | "actualEffort";
  label: string;
  disabled?: boolean;
  setId: string;
  value: number | null;
  step: string;
  unit?: string;
  min?: number;
  onChange: (value: number | null) => void;
  onPersist: (value: number | null) => void;
}) {
  const id = `${field}-${setId}`;
  const error =
    field === "reps" && value !== null && value <= 0
      ? "Debe ser mayor que cero."
      : field === "weight" && value !== null && value < 0
        ? "No puede ser negativo."
        : field === "actualEffort" &&
            value !== null &&
            (value < min || value > 10)
          ? `Debe estar entre ${min} y 10.`
          : "";
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0">
      <label className="text-sm font-bold text-foreground" htmlFor={id}>
        {label}
        {unit ? (
          <span className="ml-1 font-normal text-muted-foreground">
            ({unit})
          </span>
        ) : null}
      </label>
      <Input
        aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
        aria-invalid={Boolean(error)}
        className="mt-2 h-14 px-2 text-center text-2xl font-extrabold tabular-nums"
        disabled={disabled}
        id={id}
        inputMode={field === "weight" ? "decimal" : "numeric"}
        min={min}
        onBlur={(event) => {
          const nextValue = parseWorkoutValue(event.target.value);
          onPersist(nextValue);
        }}
        onChange={(event) => onChange(parseWorkoutValue(event.target.value))}
        onFocus={(event) => event.currentTarget.select()}
        step={step}
        type="number"
        value={value ?? ""}
      />
      <p className="sr-only" id={descriptionId}>
        {field === "weight"
          ? "Introduce el peso usado en kilogramos."
          : field === "actualEffort"
            ? "Introduce el esfuerzo real de la serie."
            : "Introduce las repeticiones realizadas."}
      </p>
      {error ? (
        <p className="mt-1 text-xs font-semibold text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function WorkoutTextArea({
  label,
  disabled = false,
  maxLength,
  onChange,
  onPersist,
  placeholder,
  value,
}: {
  label: string;
  disabled?: boolean;
  maxLength: number;
  onChange: (value: string) => void;
  onPersist: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold text-foreground">
      {label}
      <textarea
        className="mt-2 min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        disabled={disabled}
        maxLength={maxLength}
        onBlur={(event) => onPersist(event.target.value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function ExerciseSection({
  exercise,
  exerciseIndex,
  activeSetId,
  savingIds,
  onSelect,
  onToggle,
  readOnly,
}: {
  exercise: LiveWorkoutExercise;
  exerciseIndex: number;
  activeSetId: string;
  savingIds: Set<string>;
  onSelect: (setId: string) => void;
  onToggle: (entry: WorkoutSetEntry) => void;
  readOnly: boolean;
}) {
  const completed = exercise.sets.filter((set) => set.completed).length;
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between gap-4 px-1">
        <div className="flex min-w-0 items-center">
          <h3 className="min-w-0 truncate font-bold">
            <span className="mr-3 font-mono text-sm text-primary">
              {String(exerciseIndex + 1).padStart(2, "0")}
            </span>
            {exercise.name}
          </h3>
          {exercise.videoUrl ? (
            <ExerciseVideoButton
              className="text-primary hover:bg-primary/15"
              exerciseName={exercise.name}
              videoUrl={exercise.videoUrl}
            />
          ) : null}
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          {completed}/{exercise.sets.length}
        </p>
      </div>
      <div className="space-y-2">
        {exercise.sets.map((set, setIndex) => {
          const isActive = set.id === activeSetId;
          const entry = { exercise, exerciseIndex, set, setIndex };
          return (
            <div
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "grid grid-cols-[1fr_3rem] overflow-hidden rounded-lg border transition-colors",
                isActive
                  ? "border-primary bg-primary/15"
                  : set.completed
                    ? "border-success/35 bg-success/10"
                    : "border-border-strong/25",
              )}
              key={set.id}
            >
              <button
                className="flex min-h-14 min-w-0 items-center gap-3 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                onClick={() => onSelect(set.id)}
                type="button"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",
                    set.completed
                      ? "bg-success text-success-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {set.completed ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    set.setNumber
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    Serie {set.setNumber}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {formatSetValues(set)} · {formatRest(set.restSeconds)}
                  </span>
                </span>
                {isActive ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                ) : null}
              </button>
              <button
                aria-label={`Marcar serie ${set.setNumber} de ${exercise.name} como ${set.completed ? "pendiente" : "completada"}`}
                aria-pressed={set.completed}
                className={cn(
                  "grid min-h-14 place-items-center border-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60",
                  set.completed
                    ? "border-success/35 text-success"
                    : "border-border-strong/25 text-muted-foreground hover:text-primary",
                )}
                disabled={readOnly || savingIds.has(set.id)}
                onClick={() => onToggle(entry)}
                type="button"
              >
                {savingIds.has(set.id) ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : set.completed ? (
                  <Check aria-hidden="true" className="size-5" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border-2"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MobileActionDock({
  activeEntry,
  effortMetric,
  status,
  savingIds,
  restSeconds,
  isFinished,
  isClosing,
  error,
  onComplete,
  onToggle,
}: {
  activeEntry: WorkoutSetEntry | undefined;
  effortMetric: "rir" | "rpe";
  status: "in_progress" | "completed" | "abandoned";
  savingIds: Set<string>;
  restSeconds: number | null;
  isFinished: boolean;
  isClosing: boolean;
  error: string;
  onComplete: () => void;
  onToggle: (entry: WorkoutSetEntry) => void;
}) {
  const isSaving = activeEntry
    ? savingIds.has(activeEntry.set.id)
    : savingIds.size > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong/30 bg-surface-inverse px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-overlay sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="hidden min-w-0 flex-1 sm:block">
          {activeEntry ? (
            <>
              <div className="flex items-center gap-1">
                <p className="truncate text-sm font-bold">
                  {activeEntry.exercise.name} · Serie{" "}
                  {activeEntry.set.setNumber}
                </p>
                {activeEntry.exercise.videoUrl ? (
                  <ExerciseVideoButton
                    className="size-9 text-primary hover:bg-primary/15"
                    exerciseName={activeEntry.exercise.name}
                    videoUrl={activeEntry.exercise.videoUrl}
                  />
                ) : null}
              </div>
              <p
                aria-live="polite"
                className="mt-0.5 text-xs text-muted-foreground"
              >
                {error
                  ? "Revisa el error de guardado"
                  : savingIds.size > 0
                    ? "Guardando cambios…"
                    : "Todo guardado"}
              </p>
            </>
          ) : null}
        </div>

        {restSeconds !== null ? (
          <div className="flex shrink-0 items-center gap-2 text-warning">
            <Timer aria-hidden="true" className="size-4" />
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatCompactDuration(restSeconds)}
            </span>
          </div>
        ) : null}

        {status !== "in_progress" ? (
          <Link
            className="inline-flex min-h-13 flex-1 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground sm:max-w-xs"
            href="/client/sessions"
          >
            Volver a mis sesiones
          </Link>
        ) : isFinished ? (
          <Link
            className={cn(
              "inline-flex min-h-13 flex-1 items-center justify-center rounded-lg px-5 text-sm font-bold sm:max-w-xs",
              savingIds.size > 0
                ? "pointer-events-none bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-accent-foreground",
            )}
            href="/client/sessions"
            aria-disabled={savingIds.size > 0}
            onClick={(event) => {
              event.preventDefault();
              if (isClosing) return;
              onComplete();
            }}
          >
            {savingIds.size > 0
              ? "Guardando última serie…"
              : "Finalizar entrenamiento"}
          </Link>
        ) : activeEntry ? (
          <button
            className={cn(
              "inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse disabled:pointer-events-none disabled:opacity-60 sm:max-w-xs",
              activeEntry.set.completed
                ? "border border-border-strong/40 text-surface-inverse-foreground hover:bg-muted-foreground/15"
                : "bg-primary text-primary-foreground hover:bg-accent-foreground",
            )}
            disabled={
              isSaving || hasInvalidValues(activeEntry.set, effortMetric)
            }
            onClick={() => onToggle(activeEntry)}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : activeEntry.set.completed ? (
              <RotateCcw aria-hidden="true" className="size-4" />
            ) : (
              <Check aria-hidden="true" className="size-4" />
            )}
            {isSaving
              ? "Guardando…"
              : activeEntry.set.completed
                ? "Marcar pendiente"
                : `Completar serie ${activeEntry.set.setNumber}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CompletionPanel({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (feedback: CompletionFeedback) => void;
}) {
  const [feedback, setFeedback] = useState<CompletionFeedback>({
    energy: "",
    sessionRpe: "",
    sorenessLevel: "",
    sorenessDescription: "",
    clientNote: "",
  });

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/55 p-0 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-labelledby="completion-title"
    >
      <form
        className="w-full max-w-xl rounded-t-2xl bg-card p-5 text-card-foreground shadow-overlay sm:rounded-2xl sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(feedback);
        }}
      >
        <p className="font-mono text-label font-bold uppercase tracking-label text-primary">
          Cierre de sesión
        </p>
        <h2
          className="mt-2 text-2xl font-bold tracking-tight"
          id="completion-title"
        >
          Finalizar entrenamiento
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          El feedback es opcional. Puedes guardar solo lo que quieras registrar.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <CompletionNumberInput
            label="Energía"
            max={5}
            min={1}
            onChange={(energy) =>
              setFeedback((current) => ({ ...current, energy }))
            }
            value={feedback.energy}
          />
          <CompletionNumberInput
            label="RPE general"
            max={10}
            min={1}
            onChange={(sessionRpe) =>
              setFeedback((current) => ({ ...current, sessionRpe }))
            }
            value={feedback.sessionRpe}
          />
          <CompletionNumberInput
            label="Molestia"
            max={10}
            min={0}
            onChange={(sorenessLevel) =>
              setFeedback((current) => ({ ...current, sorenessLevel }))
            }
            value={feedback.sorenessLevel}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CompletionTextArea
            label="Descripción de molestia"
            maxLength={2000}
            onChange={(sorenessDescription) =>
              setFeedback((current) => ({ ...current, sorenessDescription }))
            }
            value={feedback.sorenessDescription}
          />
          <CompletionTextArea
            label="Nota para tu trainer"
            maxLength={2000}
            onChange={(clientNote) =>
              setFeedback((current) => ({ ...current, clientNote }))
            }
            value={feedback.clientNote}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-bold hover:bg-muted disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Volver
          </button>
          <button
            className="min-h-11 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-accent-foreground disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Cerrando sesión…" : "Finalizar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompletionNumberInput({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `completion-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="text-sm font-bold" htmlFor={id}>
      {label}
      <input
        className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-3 text-center text-lg font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
        id={id}
        inputMode="numeric"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step="1"
        type="number"
        value={value}
      />
    </label>
  );
}

function CompletionTextArea({
  label,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function flattenWorkoutSets(
  exercises: LiveWorkoutExercise[],
): WorkoutSetEntry[] {
  return exercises.flatMap((exercise, exerciseIndex) =>
    exercise.sets.map((set, setIndex) => ({
      exercise,
      exerciseIndex,
      set,
      setIndex,
    })),
  );
}

function findFirstIncompleteSetId(exercises: LiveWorkoutExercise[]) {
  return flattenWorkoutSets(exercises).find((entry) => !entry.set.completed)
    ?.set.id;
}

function hasInvalidValues(set: LiveWorkoutSet, effortMetric: "rir" | "rpe") {
  return (
    (set.reps !== null && set.reps <= 0) ||
    (set.weight !== null && set.weight < 0) ||
    !isValidEffort(effortMetric, set.actualEffort)
  );
}

function formatPlannedSet(set: LiveWorkoutSet) {
  const reps =
    set.plannedRepsMin === null || set.plannedRepsMax === null
      ? null
      : set.plannedRepsMin === set.plannedRepsMax
        ? `${set.plannedRepsMin} reps`
        : `${set.plannedRepsMin}–${set.plannedRepsMax} reps`;
  const values = [
    setTypeLabel(set.setType),
    set.trainingMethod === "traditional"
      ? null
      : getTrainingMethod(set.trainingMethod).label,
    reps,
    set.plannedWeight === null ? null : `${formatNumber(set.plannedWeight)} kg`,
    set.plannedTargetEffort === null
      ? null
      : `objetivo ${set.plannedTargetEffort}`,
    set.tempo ? `tempo ${set.tempo}` : null,
    set.isOptional ? "opcional" : null,
  ].filter(Boolean);
  return values.join(" · ");
}

function setTypeLabel(setType: LiveWorkoutSet["setType"]) {
  return {
    warmup: "Calentamiento",
    ramp_up: "Aproximación",
    working: "Trabajo",
    drop_set: "Drop set",
    amrap: "AMRAP",
  }[setType];
}

function parseWorkoutValue(value: string) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value: string) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function sessionStatusLabel(status: "in_progress" | "completed" | "abandoned") {
  return {
    in_progress: "En progreso",
    completed: "Finalizada",
    abandoned: "Abandonada",
  }[status];
}

function formatPerformance(performance: PreviousSetPerformance) {
  const values = [
    performance.weight === null
      ? null
      : `${formatNumber(performance.weight)} kg`,
    performance.reps === null ? null : `${formatNumber(performance.reps)} rep`,
  ].filter(Boolean);
  if (values.length === 0) return "Sin valores registrados";
  return `${values.join(" × ")} · ${formatShortDate(performance.performedAt)}`;
}

function formatSetValues(set: LiveWorkoutSet) {
  const values = [
    set.weight === null ? null : `${formatNumber(set.weight)} kg`,
    set.reps === null ? null : `${formatNumber(set.reps)} rep`,
  ].filter(Boolean);
  return values.length > 0 ? values.join(" × ") : "Sin valores";
}

function formatRest(seconds: number | null) {
  return seconds === null ? "Descanso libre" : `${seconds} s de descanso`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatCompactDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

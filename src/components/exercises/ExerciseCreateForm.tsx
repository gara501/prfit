"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
import {
  createExercise,
  type RoutineActionState,
} from "@/lib/routines/actions";

const initialActionState: RoutineActionState = {
  status: "idle",
  message: "",
};

type ExerciseCreatePanelProps = {
  description?: string;
  eyebrow?: string;
  formId?: string;
};

export function ExerciseCreatePanel({
  description = "Añádelo al catálogo sin abandonar el plan.",
  eyebrow = "Catálogo rápido",
  formId,
}: ExerciseCreatePanelProps) {
  const pathname = usePathname();
  const [state, action, isPending] = useActionState(
    createExercise,
    initialActionState,
  );

  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-black">Crear ejercicio</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      <div className="mt-4 space-y-3">
        <input
          form={formId}
          name="currentPath"
          type="hidden"
          value={pathname}
        />
        <div>
          <label
            className="mb-1.5 block text-xs font-bold text-slate-300"
            htmlFor="exercise-create-name"
          >
            Nombre
          </label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            form={formId}
            id="exercise-create-name"
            maxLength={100}
            name="exerciseName"
            placeholder="Peso muerto rumano"
            required
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-bold text-slate-300"
            htmlFor="exercise-create-video"
          >
            Video de ejemplo <span className="font-normal">(opcional)</span>
          </label>
          <input
            aria-describedby="exercise-create-video-help"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            form={formId}
            id="exercise-create-video"
            inputMode="url"
            maxLength={2048}
            name="exerciseVideoUrl"
            placeholder="https://youtu.be/…"
            type="url"
          />
          <p
            className="mt-1.5 text-xs leading-5 text-slate-400"
            id="exercise-create-video-help"
          >
            Enlace HTTPS de YouTube, Shorts o youtu.be.
          </p>
        </div>
        <button
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-orange-400 disabled:opacity-60"
          disabled={isPending}
          form={formId}
          formAction={action}
          formNoValidate
          type="submit"
        >
          {isPending ? "Creando…" : "Crear en catálogo"}
        </button>
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-3 text-xs ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}

export function ExerciseCreateForm(props: ExerciseCreatePanelProps) {
  return (
    <form>
      <ExerciseCreatePanel {...props} />
    </form>
  );
}

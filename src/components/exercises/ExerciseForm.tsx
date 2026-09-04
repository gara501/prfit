"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  type ExerciseActionState,
  saveExercise,
} from "@/lib/exercises/actions";
import type {
  ExerciseCatalogItem,
  ExerciseTaxonomyOption,
} from "@/lib/exercises/types";

const initialState: ExerciseActionState = { status: "idle", message: "" };

export function ExerciseForm({
  exercise,
  bodyZones,
  equipment,
}: {
  exercise: ExerciseCatalogItem | null;
  bodyZones: ExerciseTaxonomyOption[];
  equipment: ExerciseTaxonomyOption[];
}) {
  const [state, action, isPending] = useActionState(saveExercise, initialState);
  const selectedBodyZones = new Set(exercise?.bodyZones.map((item) => item.id));
  const selectedEquipment = new Set(exercise?.equipment.map((item) => item.id));

  return (
    <form action={action} className="space-y-8">
      {exercise ? (
        <input name="exerciseId" type="hidden" value={exercise.id} />
      ) : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>No pudimos guardar el ejercicio</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-6 lg:grid-cols-2">
        <label
          className="block text-sm font-bold text-foreground lg:col-span-2"
          htmlFor="exercise-name"
        >
          Nombre del ejercicio
          <Input
            className="mt-2"
            defaultValue={exercise?.name}
            id="exercise-name"
            maxLength={100}
            name="name"
            placeholder="Press inclinado con mancuernas"
            required
          />
        </label>

        <label
          className="block text-sm font-bold text-foreground"
          htmlFor="exercise-video"
        >
          Video de referencia
          <Input
            aria-describedby="exercise-video-help"
            className="mt-2"
            defaultValue={exercise?.videoUrl}
            id="exercise-video"
            inputMode="url"
            maxLength={2048}
            name="videoUrl"
            placeholder="https://youtu.be/…"
            type="url"
          />
          <span
            className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground"
            id="exercise-video-help"
          >
            Acepta enlaces HTTPS de YouTube, Shorts o youtu.be.
          </span>
        </label>

        <label
          className="block text-sm font-bold text-foreground"
          htmlFor="exercise-image"
        >
          Imagen de referencia
          <Input
            aria-describedby="exercise-image-help"
            className="mt-2"
            defaultValue={exercise?.imageUrl}
            id="exercise-image"
            inputMode="url"
            maxLength={2048}
            name="imageUrl"
            placeholder="https://…"
            type="url"
          />
          <span
            className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground"
            id="exercise-image-help"
          >
            URL HTTPS opcional para identificarlo visualmente.
          </span>
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaxonomyFieldset
          description="Selecciona una o varias regiones principales."
          emptyMessage="No hay zonas corporales configuradas."
          legend="Zonas corporales"
          name="bodyZoneIds"
          options={bodyZones}
          selectedIds={selectedBodyZones}
        />
        <TaxonomyFieldset
          description="Indica qué material se necesita para realizarlo."
          emptyMessage="No hay equipamiento configurado."
          legend="Equipamiento"
          name="equipmentIds"
          options={equipment}
          selectedIds={selectedEquipment}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-strong bg-card px-5 text-sm font-black text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/trainer/exercises"
        >
          Cancelar
        </Link>
        <button
          className="min-h-11 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? "Guardando…"
            : exercise
              ? "Guardar cambios"
              : "Crear ejercicio"}
        </button>
      </div>
    </form>
  );
}

function TaxonomyFieldset({
  description,
  emptyMessage,
  legend,
  name,
  options,
  selectedIds,
}: {
  description: string;
  emptyMessage: string;
  legend: string;
  name: string;
  options: ExerciseTaxonomyOption[];
  selectedIds: Set<string>;
}) {
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <legend className="px-1 text-lg font-black text-card-foreground">
        {legend}
      </legend>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {options.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-accent-foreground"
              key={option.id}
            >
              <input
                className="size-4 accent-primary"
                defaultChecked={selectedIds.has(option.id)}
                name={name}
                type="checkbox"
                value={option.id}
              />
              {option.name}
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </fieldset>
  );
}

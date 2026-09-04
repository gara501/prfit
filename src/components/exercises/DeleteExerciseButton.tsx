"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteExercise } from "@/lib/exercises/actions";

export function DeleteExerciseButton({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string;
  exerciseName: string;
}) {
  return (
    <form action={deleteExercise}>
      <input name="exerciseId" type="hidden" value={exerciseId} />
      <DeleteSubmitButton exerciseName={exerciseName} />
    </form>
  );
}

function DeleteSubmitButton({ exerciseName }: { exerciseName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={`Eliminar ${exerciseName}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`¿Eliminar “${exerciseName}” del catálogo?`))
          event.preventDefault();
      }}
      type="submit"
    >
      <Trash2 aria-hidden="true" className="size-4" />
      <span className="sm:hidden xl:inline">
        {pending ? "Eliminando…" : "Eliminar"}
      </span>
    </button>
  );
}

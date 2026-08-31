"use client";

import { deleteRoutineDraft } from "@/lib/routines/actions";

export function DeleteRoutineButton({ routineId }: { routineId: string }) {
  return (
    <form
      action={deleteRoutineDraft}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta rutina y todos sus ejercicios?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="routineId" type="hidden" value={routineId} />
      <button
        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-50"
        type="submit"
      >
        Eliminar borrador
      </button>
    </form>
  );
}

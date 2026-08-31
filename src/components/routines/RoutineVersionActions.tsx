"use client";

import Link from "next/link";
import {
  archiveRoutineVersion,
  cloneRoutineVersion,
  publishRoutineVersion,
} from "@/lib/routines/actions";
import type { RoutineVersionStatus } from "@/lib/routines/types";
import { DeleteRoutineButton } from "./DeleteRoutineButton";

export function RoutineVersionActions({
  routineId,
  status,
}: {
  routineId: string;
  status: RoutineVersionStatus;
}) {
  if (status === "draft") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-orange-400"
          href={`/trainer/routines/${routineId}/edit`}
        >
          Editar borrador
        </Link>
        <form
          action={publishRoutineVersion}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "¿Publicar este plan? No podrás editar esta versión después.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="routineId" type="hidden" value={routineId} />
          <button
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-orange-400"
            type="submit"
          >
            Publicar plan
          </button>
        </form>
        <DeleteRoutineButton routineId={routineId} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <form action={cloneRoutineVersion}>
        <input name="routineId" type="hidden" value={routineId} />
        <button
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-orange-400"
          type="submit"
        >
          Crear nueva versión
        </button>
      </form>
      {status === "published" ? (
        <form
          action={archiveRoutineVersion}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "¿Archivar este plan? El cliente ya no podrá iniciarlo.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="routineId" type="hidden" value={routineId} />
          <button
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            type="submit"
          >
            Archivar
          </button>
        </form>
      ) : null}
    </div>
  );
}

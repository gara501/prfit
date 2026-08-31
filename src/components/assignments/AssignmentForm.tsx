"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  type AssignmentFormState,
  assignClient,
} from "@/lib/assignments/actions";
import type {
  ClientAssignment,
  TrainerOption,
} from "@/lib/assignments/queries";

const initialState: AssignmentFormState = { status: "idle", message: "" };

const getName = (firstName: string, lastName: string, fallback: string) =>
  `${firstName} ${lastName}`.trim() || fallback;

export function AssignmentForm({
  role,
  currentUserId,
  assignments,
  trainers,
}: {
  role: "admin" | "trainer";
  currentUserId: string;
  assignments: ClientAssignment[];
  trainers: TrainerOption[];
}) {
  const [state, formAction] = useActionState(assignClient, initialState);
  const selectableClients =
    role === "admin"
      ? assignments
      : assignments.filter((assignment) => !assignment.assignmentId);
  const canAssign = selectableClients.length > 0 && trainers.length > 0;

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <label className="block text-sm font-bold" htmlFor="clientId">
        Cliente
        <select
          id="clientId"
          name="clientId"
          required
          disabled={!canAssign}
          defaultValue=""
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
        >
          <option value="" disabled>
            {selectableClients.length > 0
              ? "Selecciona un cliente"
              : "No hay clientes disponibles"}
          </option>
          {selectableClients.map((client) => (
            <option key={client.clientId} value={client.clientId}>
              {getName(
                client.clientFirstName,
                client.clientLastName,
                "Cliente sin nombre",
              )}
              {client.trainerId ? " · reasignar" : " · disponible"}
            </option>
          ))}
        </select>
      </label>

      {role === "admin" ? (
        <label className="block text-sm font-bold" htmlFor="trainerId">
          Entrenador
          <select
            id="trainerId"
            name="trainerId"
            required
            disabled={!canAssign}
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          >
            <option value="" disabled>
              {trainers.length > 0
                ? "Selecciona un entrenador"
                : "No hay entrenadores activos"}
            </option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {getName(
                  trainer.firstName,
                  trainer.lastName,
                  "Entrenador sin nombre",
                )}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="trainerId" value={currentUserId} />
      )}

      {state.status !== "idle" ? (
        <output
          className={`rounded-xl border px-3.5 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
              : "border-red-800 bg-red-950/60 text-red-300"
          }`}
        >
          {state.message}
        </output>
      ) : null}

      <SubmitButton disabled={!canAssign} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {pending ? "Guardando vínculo…" : "Activar vínculo"}
    </button>
  );
}

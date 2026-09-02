"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  type CreateTrainerClientState,
  createTrainerClient,
} from "@/lib/trainer-dashboard/actions";

const initialState: CreateTrainerClientState = {
  status: "idle",
  message: "",
  clientId: "",
};

export function CreateClientForm() {
  const [state, action, isPending] = useActionState(
    createTrainerClient,
    initialState,
  );

  return (
    <form action={action} className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" name="firstName" />
        <Field label="Apellido" name="lastName" />
      </div>
      <Field autoComplete="email" label="Correo" name="email" type="email" />
      <Field autoComplete="tel" label="Teléfono" name="phone" type="tel" />
      <Field label="Fecha de nacimiento" name="birthDate" type="date" />

      {state.message ? (
        <div
          aria-live="polite"
          className={`rounded-xl px-3.5 py-3 text-xs font-semibold leading-5 ${
            state.status === "error"
              ? "bg-red-950 text-red-200"
              : "bg-emerald-950 text-emerald-200"
          }`}
        >
          <p>{state.message}</p>
          {state.clientId ? (
            <Link
              className="mt-2 inline-block font-black underline"
              href={`/trainer/clients/${state.clientId}`}
            >
              Abrir ficha
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-slate-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.14)] hover:bg-orange-400 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Enviando invitación…" : "Invitar cliente"}
      </button>
      <p className="text-[11px] leading-5 text-slate-500">
        Recibirá un correo para crear su contraseña y quedará asignado
        automáticamente a ti.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-400">
        {label}
      </span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-orange-400"
        name={name}
        required={name !== "birthDate"}
        type={type}
        {...props}
      />
    </label>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  type CreateUserFormState,
  createUser,
} from "@/app/admin/users/actions";

const initialState: CreateUserFormState = { status: "idle", message: "" };

export function CreateUserForm({
  defaultRole = "client",
}: {
  defaultRole?: "trainer" | "client";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-7 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Nombre"
          name="firstName"
          autoComplete="given-name"
          disabled={pending}
        />
        <Field
          label="Apellido"
          name="lastName"
          autoComplete="family-name"
          disabled={pending}
        />
      </div>
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        disabled={pending}
      />
      <Field
        label="Teléfono"
        name="phone"
        type="tel"
        autoComplete="tel"
        disabled={pending}
        required={false}
      />

      <label className="block text-sm font-semibold" htmlFor="role">
        Rol
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultRole}
          disabled={pending}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none transition disabled:cursor-wait disabled:opacity-60 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
        >
          <option value="trainer">Entrenador</option>
          <option value="client">Cliente</option>
        </select>
      </label>

      {state.status !== "idle" ? (
        <output
          aria-live="polite"
          className={`block rounded-xl border px-3.5 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
              : "border-red-800 bg-red-950/60 text-red-300"
          }`}
        >
          {state.message}
        </output>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-slate-950 active:translate-y-px"
      >
        {pending ? "Enviando invitación…" : "Enviar invitación"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  disabled,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
      />
    </label>
  );
}

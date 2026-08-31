"use client";

import {
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactNode,
  useActionState,
} from "react";
import { type ProfileActionState, updateProfile } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";

const initialState: ProfileActionState = { status: "idle", message: "" };

export function ProfileForm({
  firstName,
  lastName,
  email,
  phone,
  birthDate,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return (
    <form action={action} className="space-y-8">
      <section>
        <p className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-orange-700">
          Datos personales
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="firstName">
            <Input defaultValue={firstName} minLength={2} required />
          </Field>
          <Field label="Apellido" name="lastName">
            <Input defaultValue={lastName} minLength={2} required />
          </Field>
        </div>
      </section>
      <section className="border-t border-slate-200 pt-7">
        <p className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-orange-700">
          Contacto
        </p>
        <div className="mt-4 grid gap-4">
          <Field
            hint="El correo se gestiona desde tu cuenta de acceso."
            label="Correo electrónico"
          >
            <Input defaultValue={email} readOnly type="email" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" name="phone">
              <Input defaultValue={phone} inputMode="tel" type="tel" />
            </Field>
            <Field hint="Opcional" label="Fecha de nacimiento" name="birthDate">
              <Input defaultValue={birthDate} type="date" />
            </Field>
          </div>
        </div>
      </section>
      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={`rounded-xl border p-4 text-sm font-bold ${state.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
function Field({
  label,
  name,
  hint,
  children,
}: {
  label: string;
  name?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block text-sm font-bold text-slate-700">
      <div className="flex justify-between gap-3">
        <p>{label}</p>
        {hint ? (
          <span className="text-xs font-medium text-slate-400">{hint}</span>
        ) : null}
      </div>
      <div className="mt-2 block">
        {cloneWithFieldProps(children, name, label)}
      </div>
    </div>
  );
}
function cloneWithFieldProps(
  child: ReactNode,
  name: string | undefined,
  label: string,
) {
  return isValidElement<ComponentProps<"input">>(child)
    ? cloneElement(child, { name, "aria-label": label })
    : child;
}

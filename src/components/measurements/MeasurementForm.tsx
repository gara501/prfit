"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  type MeasurementFormState,
  saveMeasurement,
} from "@/lib/measurements/actions";
import type {
  BodyMeasurement,
  MeasurementClient,
} from "@/lib/measurements/types";

const initialState: MeasurementFormState = { status: "idle", message: "" };

export function MeasurementForm({
  clients,
  defaultClientId,
  measurement,
}: {
  clients: MeasurementClient[];
  defaultClientId?: string;
  measurement: BodyMeasurement | null;
}) {
  const [state, action, isPending] = useActionState(
    saveMeasurement,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-6">
      <input name="measurementId" type="hidden" value={measurement?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="measurement-client" label="Cliente">
          <select
            className={inputClass}
            defaultValue={measurement?.clientId ?? defaultClientId ?? ""}
            disabled={Boolean(measurement)}
            id="measurement-client"
            name="clientId"
            required
          >
            <option disabled value="">
              Selecciona un cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {`${client.firstName} ${client.lastName}`.trim()}
              </option>
            ))}
          </select>
          {measurement ? (
            <input name="clientId" type="hidden" value={measurement.clientId} />
          ) : null}
        </Field>
        <Field htmlFor="measurement-date" label="Fecha">
          <input
            className={inputClass}
            defaultValue={measurement?.date ?? today}
            id="measurement-date"
            name="date"
            required
            type="date"
          />
        </Field>
      </div>

      <section>
        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
          Composición principal
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumberField
            defaultValue={measurement?.weight}
            label="Peso"
            name="weight"
            suffix="kg"
          />
          <NumberField
            defaultValue={measurement?.height}
            label="Altura"
            name="height"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.fatPercentage}
            label="Grasa"
            name="fatPercentage"
            suffix="%"
          />
        </div>
      </section>

      <section>
        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
          Perímetros
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField
            defaultValue={measurement?.neck}
            label="Cuello"
            name="neck"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.chest}
            label="Pecho"
            name="chest"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.shoulders}
            label="Hombros"
            name="shoulders"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.waist}
            label="Cintura"
            name="waist"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.hips}
            label="Cadera"
            name="hips"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.rightArm}
            label="Brazo der."
            name="rightArm"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.leftArm}
            label="Brazo izq."
            name="leftArm"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.rightLeg}
            label="Pierna der."
            name="rightLeg"
            suffix="cm"
          />
          <NumberField
            defaultValue={measurement?.leftLeg}
            label="Pierna izq."
            name="leftLeg"
            suffix="cm"
          />
        </div>
      </section>

      <Field htmlFor="measurement-notes" label="Notas">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          defaultValue={measurement?.notes ?? ""}
          id="measurement-notes"
          maxLength={2000}
          name="notes"
          placeholder="Contexto de la medición, sensaciones o cambios observados…"
        />
      </Field>

      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            state.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="flex-1 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-orange-400 disabled:opacity-60"
          disabled={isPending || clients.length === 0}
          type="submit"
        >
          {isPending
            ? "Guardando…"
            : measurement
              ? "Actualizar medición"
              : "Registrar medición"}
        </button>
        {measurement ? (
          <Link
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-600"
            href="/trainer/measurements"
          >
            Cancelar
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function NumberField({
  defaultValue,
  label,
  name,
  suffix,
}: {
  defaultValue: number | null | undefined;
  label: string;
  name: string;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <span className="relative block">
        <input
          className={`${inputClass} pr-10`}
          defaultValue={defaultValue ?? ""}
          min={0}
          name={name}
          step="0.1"
          type="number"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[10px] font-black text-slate-400">
          {suffix}
        </span>
      </span>
    </label>
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-bold text-slate-600"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100";

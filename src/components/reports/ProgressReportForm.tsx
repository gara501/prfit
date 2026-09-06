"use client";

import { Download, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function ProgressReportForm({
  clientId,
  defaultFrom,
  defaultTo,
  exercises,
}: {
  clientId: string;
  defaultFrom: string;
  defaultTo: string;
  exercises: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<"anonymous" | "complete">("anonymous");

  return (
    <form
      action={`/api/reports/progress/${clientId}`}
      className="space-y-8"
      method="post"
    >
      <fieldset>
        <legend className="text-lg font-black">Periodo del reporte</legend>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Puedes consultar hasta 24 meses por documento.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="report-from" label="Desde">
            <input
              className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaultFrom}
              id="report-from"
              max={defaultTo}
              name="from"
              required
              type="date"
            />
          </Field>
          <Field id="report-to" label="Hasta">
            <input
              className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaultTo}
              id="report-to"
              max={defaultTo}
              name="to"
              required
              type="date"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-black">Privacidad</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ModeOption
            checked={mode === "anonymous"}
            description="Omite identidad, estado de salud y texto libre. Recomendado para mostrar resultados a prospectos."
            label="Anonimizado"
            onChange={() => setMode("anonymous")}
            value="anonymous"
          />
          <ModeOption
            checked={mode === "complete"}
            description="Incluye nombre, trainer, estado preventivo y observaciones. Úsalo para el cliente o una consulta autorizada."
            label="Completo"
            onChange={() => setMode("complete")}
            value="complete"
          />
        </div>
        {mode === "complete" ? (
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-6">
            <input
              className="mt-1 size-4 accent-primary"
              name="authorization"
              required
              type="checkbox"
              value="confirmed"
            />
            <span>
              Confirmo que el cliente autorizó generar y compartir este reporte
              identificable para el propósito informado.
            </span>
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-lg font-black">Contenido</legend>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-bold">
          <input
            className="size-4 accent-primary"
            defaultChecked
            name="measurements"
            type="checkbox"
            value="include"
          />
          Incluir evolución de composición corporal
        </label>
        {exercises.length ? (
          <div className="mt-5">
            <p className="text-sm font-black">Ejercicios destacados</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Selecciona hasta 8. Si no eliges ninguno, se incluirán los cinco
              con mayor volumen.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {exercises.map((exercise) => (
                <label
                  className="flex min-h-11 items-center gap-3 border-b border-border px-1 py-2 text-sm"
                  key={exercise.id}
                >
                  <input
                    className="size-4 accent-primary"
                    name="exercise"
                    type="checkbox"
                    value={exercise.id}
                  />
                  {exercise.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </fieldset>

      <Field id="report-notes" label="Observaciones del trainer (opcional)">
        <textarea
          className="min-h-28 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          disabled={mode === "anonymous"}
          id="report-notes"
          maxLength={1500}
          name="notes"
          placeholder={
            mode === "anonymous"
              ? "El modo anonimizado no incluye texto libre."
              : "Contexto útil para el cliente o profesional que recibirá el reporte."
          }
        />
      </Field>

      <div className="border-t border-border pt-6">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          El archivo se genera en el momento, no se publica y queda registrado
          únicamente como evento de auditoría.
        </p>
        <button
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px sm:w-auto"
          type="submit"
        >
          <Download aria-hidden="true" className="size-4" />
          Generar PDF
        </button>
      </div>
    </form>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2 text-sm font-black">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function ModeOption({
  checked,
  description,
  label,
  onChange,
  value,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-accent">
      <input
        checked={checked}
        className="mt-1 size-4 accent-primary"
        name="mode"
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span>
        <span className="block font-black">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

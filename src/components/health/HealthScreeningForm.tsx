"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import {
  type HealthActionState,
  submitHealthScreening,
} from "@/lib/health/actions";

const initialState: HealthActionState = { status: "idle", message: "" };
const inputClass =
  "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";
const riskQuestions = [
  [
    "heartCondition",
    "¿Un médico te ha indicado que tienes una condición cardíaca?",
  ],
  [
    "chestPain",
    "¿Sientes dolor en el pecho en reposo o durante actividad física?",
  ],
  [
    "dizzinessOrFainting",
    "¿Perdiste el equilibrio por mareo o la conciencia durante el último año?",
  ],
  [
    "highBloodPressureOrDiabetes",
    "¿Te han diagnosticado presión arterial alta o diabetes?",
  ],
  [
    "boneOrJointProblem",
    "¿Tienes un problema óseo o articular que podría empeorar con ejercicio?",
  ],
  [
    "supervisedActivityOnly",
    "¿Te recomendaron realizar actividad física únicamente bajo supervisión médica?",
  ],
] as const;

export function HealthScreeningForm({
  fullName,
  birthDate,
}: {
  fullName: string;
  birthDate: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitHealthScreening,
    initialState,
  );
  return (
    <form action={formAction} className="space-y-7">
      <section className="border border-border bg-card">
        <SectionHeading number="01" title="Datos generales" />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Nombre completo">
            <input className={inputClass} disabled value={fullName} />
          </Field>
          <Field label="Fecha de nacimiento">
            <input
              className={inputClass}
              disabled
              value={birthDate || "Sin registrar"}
            />
          </Field>
          <Field label="Sexo">
            <select className={inputClass} defaultValue="" name="sex" required>
              <option disabled value="">
                Selecciona una opción
              </option>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
              <option value="other">Otro</option>
              <option value="prefer_not_to_say">Prefiero no responder</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso actual (kg)">
              <input
                className={inputClass}
                max="350"
                min="25"
                name="weightKg"
                required
                step="0.1"
                type="number"
              />
            </Field>
            <Field label="Estatura (cm)">
              <input
                className={inputClass}
                max="250"
                min="100"
                name="heightCm"
                required
                step="0.1"
                type="number"
              />
            </Field>
          </div>
          <Field label="Contacto de emergencia">
            <input
              className={inputClass}
              maxLength={120}
              name="emergencyName"
              placeholder="Nombre completo"
              required
            />
          </Field>
          <Field label="Teléfono de emergencia">
            <input
              className={inputClass}
              maxLength={30}
              name="emergencyPhone"
              required
              type="tel"
            />
          </Field>
          <Field label="Relación">
            <input
              className={inputClass}
              maxLength={80}
              name="emergencyRelationship"
              placeholder="Familiar, pareja, amistad…"
              required
            />
          </Field>
          <Field label="Médico de cabecera (opcional)">
            <input
              className={inputClass}
              maxLength={120}
              name="physicianName"
              placeholder="Nombre"
            />
          </Field>
          <Field label="Teléfono del médico (opcional)">
            <input
              className={inputClass}
              maxLength={30}
              name="physicianPhone"
              type="tel"
            />
          </Field>
        </div>
      </section>

      <section className="border border-border bg-card">
        <SectionHeading number="02" title="Filtro de seguridad" />
        <p className="border-b border-border px-5 py-4 text-sm leading-6 text-muted-foreground sm:px-7">
          Una respuesta afirmativa no es un diagnóstico. Permitirá que tu
          trainer revise el caso antes de indicar trabajo de intensidad alta.
        </p>
        <div className="divide-y divide-border">
          {riskQuestions.map(([name, question], index) => (
            <fieldset
              className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7"
              key={name}
            >
              <legend className="contents">
                <span className="text-sm font-bold leading-6">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {question}
                </span>
              </legend>
              <div className="flex gap-2">
                <Choice label="No" name={name} value="no" />
                <Choice label="Sí" name={name} value="yes" />
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="border border-border bg-card">
        <SectionHeading number="03" title="Antecedentes relevantes" />
        <div className="space-y-6 p-5 sm:p-7">
          <fieldset>
            <legend className="text-sm font-black">
              Enfermedades crónicas
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Diabetes",
                "Hipertensión",
                "Asma",
                "Condición cardíaca",
                "Ninguna",
              ].map((item) => (
                <Check
                  key={item}
                  label={item}
                  name="chronicConditions"
                  value={item}
                />
              ))}
            </div>
          </fieldset>
          <Field label="Otras enfermedades o condiciones">
            <textarea
              className={inputClass}
              maxLength={1000}
              name="otherChronicConditions"
              rows={3}
            />
          </Field>
          <Field label="Cirugías previas">
            <textarea
              className={inputClass}
              maxLength={1500}
              name="surgeries"
              placeholder="Tipo y fecha aproximada. Escribe “Ninguna” si no aplica."
              required
              rows={3}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lesión: zona afectada">
              <input className={inputClass} maxLength={120} name="injuryArea" />
            </Field>
            <Field label="Fecha aproximada">
              <input className={inputClass} name="injuryDate" type="month" />
            </Field>
          </div>
          <Field label="Detalle de la lesión">
            <textarea
              className={inputClass}
              maxLength={1000}
              name="injuryDetails"
              rows={3}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Medicamentos actuales">
              <textarea
                className={inputClass}
                maxLength={1000}
                name="medications"
                placeholder="Nombre y dosis, o “Ninguno”."
                required
                rows={3}
              />
            </Field>
            <Field label="Alergias relevantes">
              <textarea
                className={inputClass}
                maxLength={1000}
                name="allergies"
                placeholder="Describe o escribe “Ninguna”."
                required
                rows={3}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="border border-border bg-card">
        <SectionHeading number="04" title="Situaciones especiales" />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
            <input
              className="size-5 accent-primary"
              name="pregnancyApplies"
              type="checkbox"
            />
            Embarazo actual, si aplica
          </label>
          <Field label="Semanas de gestación">
            <input
              className={inputClass}
              max="42"
              min="1"
              name="pregnancyWeeks"
              type="number"
            />
          </Field>
          <Field label="Tabaquismo">
            <select
              className={inputClass}
              defaultValue=""
              name="smoking"
              required
            >
              <option disabled value="">
                Selecciona
              </option>
              <option value="never">Nunca</option>
              <option value="former">Exfumador</option>
              <option value="current">Fumador actual</option>
            </select>
          </Field>
          <Field label="Actividad física actual">
            <select
              className={inputClass}
              defaultValue=""
              name="activityLevel"
              required
            >
              <option disabled value="">
                Selecciona
              </option>
              <option value="sedentary">Sedentario</option>
              <option value="occasional">Ocasional</option>
              <option value="active">Activo</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="border border-border bg-card">
        <SectionHeading number="05" title="Declaración y documentos" />
        <div className="space-y-5 p-5 sm:p-7">
          <p className="text-sm leading-6 text-muted-foreground">
            CardonaFit no diagnostica ni reemplaza a un médico. El trainer puede
            pausar el trabajo de intensidad alta y solicitar una valoración
            profesional si identifica una señal de riesgo.
          </p>
          <Consent name="sensitiveDataAccepted">
            Autorizo el tratamiento de estos datos sensibles para planear y
            supervisar mi entrenamiento.
          </Consent>
          <Consent name="truthAccepted">
            Declaro que la información suministrada es completa y verdadera, y
            que informaré cambios relevantes.
          </Consent>
          <Consent name="liabilityAccepted">
            Comprendo los riesgos propios de la actividad física y acepto seguir
            las indicaciones de seguridad. Este texto es informativo y debe
            integrarse con los términos legales definitivos de CardonaFit.
          </Consent>
          <Field label="Firma electrónica — escribe tu nombre completo">
            <input
              autoComplete="name"
              className={inputClass}
              maxLength={160}
              name="signedName"
              required
            />
          </Field>
          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Field label="Tipo de documento">
              <select className={inputClass} name="documentPurpose">
                <option value="medical_clearance">Autorización médica</option>
                <option value="official_parq_plus">
                  PAR-Q+ oficial diligenciado
                </option>
              </select>
            </Field>
            <Field label="Adjunto opcional (PDF, JPG o PNG · 10 MB)">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                name="document"
                type="file"
              />
            </Field>
          </div>
          {state.status === "error" ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            disabled={pending}
            type="submit"
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {pending ? "Protegiendo y enviando…" : "Firmar y enviar evaluación"}
          </button>
        </div>
      </section>
    </form>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <header className="flex items-baseline gap-3 border-b border-border px-5 py-4 sm:px-7">
      <span className="font-mono text-xs font-black text-accent-foreground">
        {number}
      </span>
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
    </header>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: The control is supplied as this label's nested child.
    <label className="grid gap-2 text-sm font-bold">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Choice({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="relative">
      <input
        className="peer sr-only"
        name={name}
        required
        type="radio"
        value={value}
      />
      <span className="grid min-h-11 min-w-14 place-items-center rounded-xl border border-input px-3 text-sm font-black peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        {label}
      </span>
    </label>
  );
}
function Check({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-input px-3 text-sm font-bold">
      <input
        className="size-4 accent-primary"
        name={name}
        type="checkbox"
        value={value}
      />
      {label}
    </label>
  );
}
function Consent({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-6">
      <input
        className="mt-1 size-5 shrink-0 accent-primary"
        name={name}
        required
        type="checkbox"
      />
      <span>{children}</span>
    </label>
  );
}

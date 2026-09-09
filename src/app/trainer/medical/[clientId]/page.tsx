import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HealthStatus } from "@/components/health/HealthStatus";
import { reviewHealthScreening } from "@/lib/health/actions";
import { getTrainerClientHealth } from "@/lib/health/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });
const riskLabels = {
  heartCondition: "Condición cardíaca indicada por un médico",
  chestPain: "Dolor en el pecho",
  dizzinessOrFainting: "Mareo, pérdida de equilibrio o conciencia",
  highBloodPressureOrDiabetes: "Presión arterial alta o diabetes",
  boneOrJointProblem: "Problema óseo o articular",
  supervisedActivityOnly: "Actividad únicamente bajo supervisión médica",
};

export default async function TrainerClientMedicalPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ error?: string; reviewed?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const result = await getTrainerClientHealth(clientId);
  if (!result) notFound();
  const { client, screening, documents } = result;
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex min-h-11 items-center text-sm font-black text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/trainer/medical"
        >
          ← Historial médico
        </Link>
        <header className="mt-4 border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Evaluación preventiva
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-title font-black tracking-tight">
              {client.name}
            </h1>
            <HealthStatus screening={screening?.summary ?? null} />
          </div>
        </header>
        {query.reviewed === "1" ? (
          <p className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-bold text-success">
            Revisión registrada.
          </p>
        ) : null}
        {query.error ? (
          <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {query.error}
          </p>
        ) : null}
        {screening?.error ? (
          <p
            role="alert"
            className="mt-5 border border-destructive bg-card p-4 text-destructive"
          >
            {screening.error}
          </p>
        ) : !screening?.payload ? (
          <section className="mt-7 border border-border bg-card p-7">
            <h2 className="text-xl font-black">Sin evaluación enviada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pide al cliente que complete la sección Salud desde su cuenta.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-7 border border-border bg-card">
              <header className="border-b border-border p-5 sm:px-7">
                <h2 className="text-xl font-black">Resumen firmado</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Versión {screening.summary.version} ·{" "}
                  {dateFormatter.format(
                    new Date(screening.summary.submittedAt),
                  )}
                </p>
              </header>
              <dl className="grid gap-px bg-border sm:grid-cols-3">
                <Metric
                  label="Peso"
                  value={`${screening.payload.weightKg} kg`}
                />
                <Metric
                  label="Estatura"
                  value={`${screening.payload.heightCm} cm`}
                />
                <Metric
                  label="Actividad"
                  value={activityLabel(screening.payload.activityLevel)}
                />
              </dl>
            </section>
            <section className="mt-7 border border-border bg-card">
              <header className="border-b border-border p-5 sm:px-7">
                <h2 className="text-xl font-black">Filtro de seguridad</h2>
              </header>
              <div className="divide-y divide-border">
                {Object.entries(screening.payload.riskAnswers).map(
                  ([key, answer]) => (
                    <div
                      className="flex items-start justify-between gap-4 px-5 py-4 text-sm sm:px-7"
                      key={key}
                    >
                      <span>{riskLabels[key as keyof typeof riskLabels]}</span>
                      <span
                        className={
                          answer === "yes"
                            ? "font-black text-destructive"
                            : "font-black text-success"
                        }
                      >
                        {answer === "yes" ? "Sí" : "No"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
            <section className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2">
              <Detail
                title="Condiciones crónicas"
                value={
                  [
                    ...screening.payload.chronicConditions,
                    screening.payload.otherChronicConditions,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No declara"
                }
              />
              <Detail title="Cirugías" value={screening.payload.surgeries} />
              <Detail
                title="Lesiones"
                value={
                  screening.payload.injuries
                    .map(
                      (item) =>
                        `${item.area}${item.approximateDate ? ` (${item.approximateDate})` : ""}: ${item.details}`,
                    )
                    .join("\n") || "No declara"
                }
              />
              <Detail
                title="Medicamentos"
                value={screening.payload.medications}
              />
              <Detail title="Alergias" value={screening.payload.allergies} />
              <Detail
                title="Contacto de emergencia"
                value={`${screening.payload.emergencyContact.name} · ${screening.payload.emergencyContact.relationship} · ${screening.payload.emergencyContact.phone}`}
              />
            </section>
            <section className="mt-7 border border-border bg-card p-5 sm:p-7">
              <h2 className="text-xl font-black">Documentos</h2>
              {documents.length ? (
                <div className="mt-4 divide-y divide-border border-y border-border">
                  {documents.map((document) => (
                    <a
                      className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={document.url}
                      key={document.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>
                        {document.original_name} ·{" "}
                        {document.purpose === "official_parq_plus"
                          ? "PAR-Q+ oficial"
                          : "Autorización médica"}
                      </span>
                      <ExternalLink aria-hidden="true" className="size-4" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay documentos adjuntos en esta versión.
                </p>
              )}
            </section>
            <form
              action={reviewHealthScreening}
              className="mt-7 border border-border bg-card p-5 sm:p-7"
            >
              <input
                name="screeningId"
                type="hidden"
                value={screening.summary.id}
              />
              <input name="clientId" type="hidden" value={client.id} />
              <h2 className="text-xl font-black">Registrar revisión</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                No diagnostiques. Registra si puedes adaptar el plan o si
                necesitas una autorización profesional antes de usar intensidad
                alta.
              </p>
              <label className="mt-5 grid gap-2 text-sm font-bold">
                Decisión
                <select
                  className="min-h-11 rounded-xl border border-input bg-background px-3"
                  name="decision"
                  required
                >
                  <option value="cleared">Puede entrenar</option>
                  <option value="cleared_with_restrictions">
                    Puede entrenar con restricciones
                  </option>
                  <option value="medical_clearance_required">
                    Solicitar autorización médica
                  </option>
                </select>
              </label>
              <label className="mt-4 grid gap-2 text-sm font-bold">
                Notas o restricciones
                <textarea
                  className="min-h-24 rounded-xl border border-input bg-background p-3"
                  maxLength={1500}
                  name="notes"
                />
              </label>
              <button
                className="mt-5 min-h-11 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                type="submit"
              >
                Guardar revisión
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5 sm:px-7">
      <dt className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black">{value}</dd>
    </div>
  );
}
function Detail({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card p-5 sm:p-7">
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
        {value || "No declara"}
      </p>
    </div>
  );
}
function activityLabel(value: string) {
  return value === "active"
    ? "Activo"
    : value === "occasional"
      ? "Ocasional"
      : "Sedentario";
}

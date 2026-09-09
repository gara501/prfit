import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { HealthScreeningForm } from "@/components/health/HealthScreeningForm";
import { HealthStatus } from "@/components/health/HealthStatus";
import { getOwnHealthScreening } from "@/lib/health/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export default async function ClientHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [{ account, current }, query] = await Promise.all([
    getOwnHealthScreening(),
    searchParams,
  ]);
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-5xl">
        <header className="border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Salud y aptitud física
          </p>
          <h1 className="mt-2 text-title font-black tracking-tight">
            Evaluación preventiva
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Información para que tu trainer adapte el entrenamiento con
            criterio. No es una consulta, diagnóstico ni certificación médica.
          </p>
        </header>

        {current?.error ? (
          <p
            role="alert"
            className="mt-5 border border-destructive bg-card p-4 text-destructive"
          >
            {current.error}
          </p>
        ) : null}
        {query.submitted === "1" ? (
          <output className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-bold text-success">
            La evaluación quedó firmada y protegida correctamente.
          </output>
        ) : null}

        <section className="mt-7 grid gap-5 border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-black">Estado actual</h2>
              <HealthStatus screening={current?.summary ?? null} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {current
                ? `Versión ${current.summary.version}, enviada el ${dateFormatter.format(new Date(current.summary.submittedAt))}. Vigente hasta ${dateFormatter.format(new Date(current.summary.expiresAt))}.`
                : "Aún no has enviado una evaluación."}
            </p>
          </div>
          {current ? (
            <RefreshCw
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
          ) : (
            <ShieldCheck
              aria-hidden="true"
              className="size-7 text-accent-foreground"
            />
          )}
        </section>

        <aside className="mt-7 border-l-4 border-warning bg-warning/10 p-5 sm:p-6">
          <h2 className="font-black">PAR-Q+ oficial, por separado</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Si tú o tu trainer desean usar el formulario oficial, descárgalo
            desde su fuente, diligéncialo sin modificaciones y adjúntalo al
            enviar esta evaluación.
          </p>
          <a
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-black text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="https://eparmedx.com/print-versions-of-par-q/"
            rel="noreferrer"
            target="_blank"
          >
            Abrir sitio oficial PAR-Q+
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </aside>

        <div className="mt-7">
          <HealthScreeningForm
            birthDate={account.birthDate}
            fullName={account.displayName}
          />
        </div>
      </div>
    </main>
  );
}

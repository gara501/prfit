import { Archive, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/require-role";

export default async function ClientDataPage() {
  await requireRole("client");
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-4xl">
        <header className="border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Privacidad y acceso
          </p>
          <h1 className="mt-2 text-title font-black tracking-tight">
            Mis datos
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Descarga una copia estructurada de la información que CardonaFit
            conserva sobre tu entrenamiento, progreso y evaluación preventiva.
          </p>
        </header>

        <section className="mt-7 border border-border bg-card p-5 sm:p-8">
          <Archive
            aria-hidden="true"
            className="size-7 text-accent-foreground"
          />
          <h2 className="mt-4 text-2xl font-black tracking-tight">
            Archivo completo ZIP
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Incluye archivos CSV y JSON, además de tus documentos médicos en su
            formato original. Dependiendo del historial y los adjuntos, la
            preparación puede tardar unos segundos.
          </p>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            <li>Perfil, asignaciones y rutinas</li>
            <li>Sesiones, series y feedback</li>
            <li>Mediciones, calendario y logros</li>
            <li>Evaluaciones y documentos médicos</li>
          </ul>
          <a
            className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px sm:w-auto"
            href="/api/exports/client-data"
          >
            <Archive aria-hidden="true" className="size-4" />
            Descargar mis datos
          </a>
          <p className="mt-5 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            El archivo se genera para esta solicitud, no se publica y contiene
            información sensible. Guárdalo en un lugar seguro.
          </p>
        </section>
      </div>
    </main>
  );
}

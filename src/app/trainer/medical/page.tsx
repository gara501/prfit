import { ChevronRight, HeartPulse as ClipboardHeart } from "lucide-react";
import Link from "next/link";
import { HealthStatus } from "@/components/health/HealthStatus";
import { getTrainerHealthClients } from "@/lib/health/queries";

export default async function TrainerMedicalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ clients, error }, query] = await Promise.all([
    getTrainerHealthClients(),
    searchParams,
  ]);
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-6xl">
        <header className="border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Clientes
          </p>
          <h1 className="mt-2 text-title font-black tracking-tight">
            Historial médico preventivo
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Revisa alertas declaradas y registra una decisión práctica para
            ajustar el entrenamiento. Esta sección no sustituye evaluación
            médica.
          </p>
        </header>
        {error || query.error ? (
          <p
            className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {error || query.error}
          </p>
        ) : null}
        <section className="mt-7 border border-border bg-card">
          <div className="grid grid-cols-[1fr_auto] border-b border-border px-5 py-3 font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground sm:px-7">
            <span>Cliente</span>
            <span>Estado</span>
          </div>
          {clients.length ? (
            <div className="divide-y divide-border">
              {clients.map(({ id, name, screening }) => (
                <Link
                  className="grid min-h-16 grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7"
                  href={`/trainer/medical/${id}`}
                  key={id}
                >
                  <span className="font-black">{name}</span>
                  <HealthStatus screening={screening?.summary ?? null} />
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ClipboardHeart
                aria-hidden="true"
                className="mx-auto size-7 text-muted-foreground"
              />
              <p className="mt-3 font-black">No hay clientes asignados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Los clientes activos aparecerán aquí.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

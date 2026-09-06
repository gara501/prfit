import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgressReportForm } from "@/components/reports/ProgressReportForm";
import { requireRole } from "@/lib/auth/require-role";
import { getCalendarDateInTimeZone } from "@/lib/gamification/streak";
import { getExportAccount } from "@/lib/reports/auth";
import { getProgressReportFormData } from "@/lib/reports/queries";

export default async function ProgressReportPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireRole("trainer");
  const account = await getExportAccount();
  const { clientId } = await params;
  if (!account) notFound();
  const data = await getProgressReportFormData(account, clientId);
  if (!data) notFound();
  const today = getCalendarDateInTimeZone();
  const fromDate = new Date(`${today}T12:00:00Z`);
  fromDate.setUTCMonth(fromDate.getUTCMonth() - 6);
  const defaultFrom = fromDate.toISOString().slice(0, 10);

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex min-h-11 items-center text-label font-black uppercase text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={`/trainer/clients/${clientId}`}
        >
          ← Ficha del cliente
        </Link>
        <header className="mt-5 border-y border-border bg-card px-5 py-7 sm:px-8">
          <p className="font-mono text-label font-black uppercase text-accent-foreground">
            Exportación profesional
          </p>
          <h1 className="mt-2 text-title font-black tracking-tight">
            Reporte de progreso
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configura el documento de {data.clientName}. Los cálculos se basan
            en sesiones y mediciones registradas, sin modificar el historial.
          </p>
        </header>
        <section className="mt-7 border border-border bg-card p-5 sm:p-8">
          <ProgressReportForm
            clientId={clientId}
            defaultFrom={defaultFrom}
            defaultTo={today}
            exercises={data.exercises}
          />
        </section>
      </div>
    </main>
  );
}

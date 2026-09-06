import { notFound } from "next/navigation";
import { PeriodizationEditor } from "@/components/periodization/PeriodizationEditor";
import { getPeriodizationWorkspace } from "@/lib/periodization/queries";

export default async function EditPeriodizationPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const { clients, plan, error } = await getPeriodizationWorkspace(planId);
  if (!plan && !error) notFound();
  if (error || !plan)
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <h1 className="text-xl font-black">No fue posible abrir el editor</h1>
          <p className="mt-2 text-sm">{error ?? "Plan no encontrado."}</p>
        </div>
      </main>
    );
  if (plan.status === "archived") notFound();
  return <PeriodizationEditor clients={clients} plan={plan} />;
}

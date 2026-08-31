import { ExerciseHistoryView } from "@/components/history/ExerciseHistoryView";
import { getClientExerciseHistory } from "@/lib/history/queries";

export default async function ClientExerciseHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string; offset?: string }>;
}) {
  const { exercise, offset } = await searchParams;
  const history = await getClientExerciseHistory(exercise, parseOffset(offset));

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 border-b border-slate-300 pb-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            Rendimiento
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Historial por ejercicio
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Revisa tus sets finalizados y compara tu rendimiento entre sesiones.
          </p>
        </header>
        <ExerciseHistoryView
          history={history}
          hrefFor={(exerciseId, nextOffset) =>
            buildClientHistoryHref(exerciseId, nextOffset)
          }
        />
      </div>
    </main>
  );
}

function buildClientHistoryHref(exerciseId?: string, offset?: number) {
  const params = new URLSearchParams();
  if (exerciseId) params.set("exercise", exerciseId);
  if (offset && offset > 0) params.set("offset", String(offset));
  const query = params.toString();
  return query ? `/client/history?${query}` : "/client/history";
}

function parseOffset(value?: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

import Link from "next/link";
import { ExerciseHistoryView } from "@/components/history/ExerciseHistoryView";
import { getTrainerExerciseHistory } from "@/lib/history/queries";

export default async function TrainerExerciseHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    exercise?: string;
    offset?: string;
  }>;
}) {
  const { client, exercise, offset } = await searchParams;
  const { clients, selectedClient, history } = await getTrainerExerciseHistory(
    client,
    exercise,
    parseOffset(offset),
  );

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-[90rem]">
        <header className="mb-9 flex flex-col gap-5 border-b border-slate-300 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Seguimiento técnico
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Historial por ejercicio
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Analiza los sets de tus clientes activos, sin mezclar volumen de
              calentamiento con el trabajo principal.
            </p>
          </div>
          {selectedClient ? (
            <p className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black">
              Cliente: {selectedClient.name}
            </p>
          ) : null}
        </header>

        {clients.length > 0 ? (
          <nav
            aria-label="Seleccionar cliente"
            className="mb-6 flex gap-2 overflow-x-auto pb-1"
          >
            {clients.map((option) => {
              const isSelected = option.id === selectedClient?.id;
              return (
                <Link
                  aria-current={isSelected ? "page" : undefined}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    isSelected
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white hover:border-orange-400"
                  }`}
                  href={buildTrainerHistoryHref(option.id)}
                  key={option.id}
                >
                  {option.name}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <ExerciseHistoryView
          history={history}
          hrefFor={(exerciseId, nextOffset) =>
            buildTrainerHistoryHref(selectedClient?.id, exerciseId, nextOffset)
          }
        />
      </div>
    </main>
  );
}

function buildTrainerHistoryHref(
  clientId?: string,
  exerciseId?: string,
  offset?: number,
) {
  const params = new URLSearchParams();
  if (clientId) params.set("client", clientId);
  if (exerciseId) params.set("exercise", exerciseId);
  if (offset && offset > 0) params.set("offset", String(offset));
  const query = params.toString();
  return query ? `/trainer/history?${query}` : "/trainer/history";
}

function parseOffset(value?: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

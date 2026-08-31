import Link from "next/link";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { getTrainerMeasurements } from "@/lib/measurements/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function TrainerMeasurementsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; edit?: string }>;
}) {
  const { client, edit } = await searchParams;
  const { clients, measurements, error } = await getTrainerMeasurements();
  const selected =
    measurements.find((measurement) => measurement.id === edit) ?? null;
  const defaultClientId = clients.some((item) => item.id === client)
    ? client
    : undefined;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 border-b border-slate-300 pb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
            Seguimiento / Composición corporal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Medir el progreso
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Registra controles periódicos y construye una lectura objetiva de la
            evolución de cada deportista.
          </p>
        </header>

        {error ? (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </p>
        ) : null}

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_27rem]">
          <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
            <div className="flex items-end justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Historial
                </p>
                <h2 className="mt-1 text-xl font-black">
                  Controles registrados
                </h2>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                {measurements.length}
              </span>
            </div>
            {measurements.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-black">Sin mediciones todavía</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Usa el formulario para registrar el primer punto de
                  referencia.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-5 py-4">Fecha</th>
                      <th className="px-5 py-4">Peso</th>
                      <th className="px-5 py-4">% grasa</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {measurements.map((measurement) => (
                      <tr key={measurement.id}>
                        <td className="px-6 py-4 font-black">
                          {measurement.clientName}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {dateFormatter.format(
                            new Date(`${measurement.date}T12:00:00`),
                          )}
                        </td>
                        <td className="px-5 py-4 font-black">
                          {measurement.weight === null
                            ? "—"
                            : `${measurement.weight} kg`}
                        </td>
                        <td className="px-5 py-4 font-black">
                          {measurement.fatPercentage === null
                            ? "—"
                            : `${measurement.fatPercentage}%`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black hover:border-orange-500 hover:text-orange-700"
                            href={`/trainer/measurements?edit=${measurement.id}`}
                          >
                            Corregir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.8)] xl:sticky xl:top-28">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
              {selected ? "Corregir control" : "Nuevo control"}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              {selected ? selected.clientName : "Registrar medición"}
            </h2>
            <div className="mt-6">
              <MeasurementForm
                clients={clients}
                defaultClientId={defaultClientId}
                measurement={selected}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

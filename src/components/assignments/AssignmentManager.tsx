import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { ClientDirectory } from "@/components/assignments/ClientDirectory";
import { CreateClientForm } from "@/components/trainer-dashboard/CreateClientForm";
import { getAssignmentManagementData } from "@/lib/assignments/queries";

export async function AssignmentManager() {
  const data = await getAssignmentManagementData();
  const activeCount = data.assignments.filter(
    (assignment) => assignment.assignmentId,
  ).length;
  const isAdmin = data.role === "admin";

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 text-slate-950 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-col gap-6 border-b border-slate-300 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              {isAdmin ? "Administración / Vínculos" : "Entrenador / Clientes"}
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {isAdmin ? "Asignar entrenadores" : "Mi cartera de clientes"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {isAdmin
                ? "Gestiona quién acompaña a cada cliente. Una transferencia cierra el vínculo anterior y activa el nuevo en una sola operación."
                : "Consulta los clientes que creaste o que un administrador asignó a tu cartera."}
            </p>
          </div>

          <dl
            className={`grid gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 shadow-sm ${
              isAdmin ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <Stat
              label={isAdmin ? "Activos" : "Mis clientes"}
              value={activeCount}
            />
            {isAdmin ? (
              <Stat
                label="Disponibles"
                value={data.assignments.length - activeCount}
              />
            ) : null}
          </dl>
        </header>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.7)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Estado de clientes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Solo se muestra el vínculo activo de cada cliente.
                </p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 font-mono text-xs font-bold text-white">
                {data.assignments.length} clientes
              </span>
            </div>

            {data.error ? (
              <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-bold text-red-900">
                  No fue posible cargar los vínculos
                </p>
                <p className="mt-1 text-sm text-red-700">{data.error}</p>
              </div>
            ) : data.assignments.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-100 text-2xl">
                  ↗
                </span>
                <p className="mt-5 text-lg font-black">
                  {isAdmin
                    ? "No hay clientes para vincular"
                    : "Aún no tienes clientes"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {isAdmin
                    ? "Crea primero una cuenta con rol Cliente desde la pantalla de Usuarios."
                    : "Crea un cliente desde el formulario lateral para incorporarlo automáticamente a tu cartera."}
                </p>
              </div>
            ) : (
              <ClientDirectory
                assignments={data.assignments}
                currentUserId={data.currentUserId}
                isAdmin={isAdmin}
              />
            )}
          </section>

          <div className="space-y-6 xl:sticky xl:top-28">
            {!isAdmin ? (
              <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)]">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
                  Nuevo deportista
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Crear cliente
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Crea su acceso y vincúlalo automáticamente a tu cartera.
                </p>
                <CreateClientForm />
              </aside>
            ) : null}

            {isAdmin ? (
              <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)]">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
                  Nuevo vínculo
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Asignar o transferir
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Si el cliente ya tiene entrenador, el vínculo anterior se
                  cerrará con la fecha de hoy.
                </p>

                <AssignmentForm
                  assignments={data.assignments}
                  trainers={data.trainers}
                />
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-28 bg-white px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black tracking-tight">{value}</dd>
    </div>
  );
}

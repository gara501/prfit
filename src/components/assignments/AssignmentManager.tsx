import Link from "next/link";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { CreateClientForm } from "@/components/trainer-dashboard/CreateClientForm";
import {
  type ClientAssignment,
  getAssignmentManagementData,
} from "@/lib/assignments/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const getName = (firstName: string, lastName: string, fallback: string) =>
  `${firstName} ${lastName}`.trim() || fallback;

export async function AssignmentManager() {
  const data = await getAssignmentManagementData();
  const activeCount = data.assignments.filter(
    (assignment) => assignment.assignmentId,
  ).length;
  const availableCount = data.assignments.length - activeCount;
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
                : "Vincula clientes disponibles a tu cuenta. Los clientes asignados a otro entrenador no aparecen en esta vista."}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 shadow-sm">
            <Stat label="Activos" value={activeCount} />
            <Stat label="Disponibles" value={availableCount} />
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
                  No hay clientes para vincular
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {isAdmin
                    ? "Crea primero una cuenta con rol Cliente desde la pantalla de Usuarios."
                    : "Crea un cliente desde el formulario lateral o espera a que haya uno disponible."}
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                {data.assignments.map((assignment) => (
                  <AssignmentRow
                    canOpenRoutine={
                      !isAdmin && assignment.trainerId === data.currentUserId
                    }
                    key={assignment.clientId}
                    assignment={assignment}
                  />
                ))}
              </ul>
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

            <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)]">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
                Nuevo vínculo
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                {isAdmin ? "Asignar o transferir" : "Tomar cliente"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isAdmin
                  ? "Si el cliente ya tiene entrenador, el vínculo anterior se cerrará con la fecha de hoy."
                  : "Solo puedes vincular clientes disponibles directamente a tu cuenta."}
              </p>

              <AssignmentForm
                role={data.role}
                currentUserId={data.currentUserId}
                assignments={data.assignments}
                trainers={data.trainers}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function AssignmentRow({
  assignment,
  canOpenRoutine,
}: {
  assignment: ClientAssignment;
  canOpenRoutine: boolean;
}) {
  const clientName = getName(
    assignment.clientFirstName,
    assignment.clientLastName,
    "Cliente sin nombre",
  );
  const trainerName = getName(
    assignment.trainerFirstName,
    assignment.trainerLastName,
    "Entrenador sin nombre",
  );

  return (
    <li className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_20px_45px_-36px_rgba(15,23,42,0.8)]">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-base font-black text-white transition group-hover:bg-orange-500 group-hover:text-slate-950">
          {clientName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black text-slate-900">
            {clientName}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {assignment.assignmentId
              ? `Con ${trainerName}`
              : "Sin entrenador activo"}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
            assignment.assignmentId
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {assignment.assignmentId ? "Activo" : "Disponible"}
        </span>
      </div>

      {assignment.assignmentId ? (
        <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <ContactDetail label="Correo" value={assignment.clientEmail} />
          <ContactDetail label="Teléfono" value={assignment.clientPhone} />
        </dl>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-xs leading-5 text-slate-400">
          Los datos de contacto estarán disponibles cuando vincules este
          cliente.
        </p>
      )}

      <div className="mt-auto border-t border-slate-200 pt-4">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          Plan activo
        </p>
        {assignment.activeRoutineId && assignment.activeRoutineName ? (
          canOpenRoutine ? (
            <Link
              className="mt-1 inline-flex items-center gap-2 text-sm font-black text-orange-700 hover:text-orange-900 hover:underline"
              href={`/trainer/routines/${assignment.activeRoutineId}`}
            >
              {assignment.activeRoutineName}
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <p className="mt-1 text-sm font-black text-slate-700">
              {assignment.activeRoutineName}
            </p>
          )
        ) : (
          <p className="mt-1 text-sm font-bold text-slate-400">
            Sin rutina activa
          </p>
        )}
        {assignment.startDate ? (
          <p className="mt-2 text-[11px] text-slate-400">
            Vinculado desde{" "}
            {dateFormatter.format(new Date(assignment.startDate))}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function ContactDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
      <dt className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="truncate font-bold text-slate-700">
        {value || "Sin registrar"}
      </dd>
    </div>
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

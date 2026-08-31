import { CreateUserForm } from "@/components/users/CreateUserForm";
import { DeactivateUserButton } from "@/components/users/DeactivateUserButton";
import {
  type AdminUserListItem,
  listAdminUsers,
  type UserRole,
} from "@/lib/supabase/admin-users";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  trainer: "Entrenador",
  client: "Cliente",
};

const roleStyles: Record<UserRole, string> = {
  admin: "border-amber-200 bg-amber-50 text-amber-800",
  trainer: "border-sky-200 bg-sky-50 text-sky-800",
  client: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function getDisplayName(user: AdminUserListItem) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || "Perfil sin nombre";
}

export async function AdminUsersDirectory({
  roleFilter,
}: {
  roleFilter?: Extract<UserRole, "trainer">;
}) {
  const { users, error, currentUserId } = await listAdminUsers();
  const displayedUsers = roleFilter
    ? users.filter((user) => user.role === roleFilter)
    : users;
  const activeCount = displayedUsers.filter((user) => user.isActive).length;
  const inactiveCount = displayedUsers.length - activeCount;
  const isTrainerDirectory = roleFilter === "trainer";

  return (
    <main className="min-h-screen bg-[#f4f6f1] px-4 py-8 text-slate-950 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-slate-300 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              PRTracker / Administración
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {isTrainerDirectory
                ? "Equipo de trainers"
                : "Equipo y deportistas"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {isTrainerDirectory
                ? "Consulta los entrenadores registrados y crea nuevos accesos profesionales."
                : "Crea accesos y consulta las personas que forman parte de la plataforma desde un solo lugar."}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 shadow-sm">
            <Stat label="Total" value={displayedUsers.length} />
            <Stat label="Activos" value={activeCount} />
            <Stat label="Inactivos" value={inactiveCount} />
          </dl>
        </header>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.7)]">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {isTrainerDirectory
                    ? "Trainers registrados"
                    : "Usuarios registrados"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ordenados desde la cuenta creada más recientemente.
                </p>
              </div>
              <span className="w-fit rounded-full bg-slate-950 px-3 py-1 font-mono text-xs font-bold text-white">
                {displayedUsers.length} registros
              </span>
            </div>

            {error ? (
              <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-5 sm:m-7">
                <p className="font-semibold text-red-900">
                  No fue posible cargar los usuarios
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-lg font-bold">
                  {isTrainerDirectory
                    ? "Todavía no hay trainers"
                    : "Todavía no hay usuarios"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Usa el formulario para crear la primera cuenta.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-7 py-4 font-semibold">Usuario</th>
                      <th className="px-5 py-4 font-semibold">Rol</th>
                      <th className="px-5 py-4 font-semibold">Estado</th>
                      <th className="px-7 py-4 text-right font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-orange-50/50 ${
                          user.isActive ? "" : "bg-slate-50/80 text-slate-500"
                        }`}
                      >
                        <td className="px-7 py-5">
                          <div className="flex items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">
                              {getDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">
                                {getDisplayName(user)}
                              </p>
                              <p className="mt-0.5 text-sm text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          {user.role ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${roleStyles[user.role]}`}
                            >
                              {roleLabels[user.role]}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Sin perfil
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-5">
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span
                              className={`size-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                            />
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-7 py-5 text-right">
                          <DeactivateUserButton
                            disabledReason={
                              !user.isActive
                                ? "Ya inactivo"
                                : user.id === currentUserId
                                  ? "Tu cuenta"
                                  : user.role === "admin"
                                    ? "Protegido"
                                    : undefined
                            }
                            userId={user.id}
                            userName={getDisplayName(user)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)] xl:sticky xl:top-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
              Nueva cuenta
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {isTrainerDirectory ? "Crear trainer" : "Crear usuario"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              La cuenta quedará confirmada y lista para iniciar sesión.
            </p>

            <CreateUserForm
              defaultRole={isTrainerDirectory ? "trainer" : "client"}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 bg-white px-4 py-3 sm:min-w-28">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black tracking-tight">{value}</dd>
    </div>
  );
}

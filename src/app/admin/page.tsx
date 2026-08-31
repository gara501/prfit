import { ArrowRight, Dumbbell, Users, Workflow } from "lucide-react";
import Link from "next/link";
import { listAdminUsers } from "@/lib/supabase/admin-users";

const sections = [
  {
    href: "/admin/users",
    title: "Usuarios",
    eyebrow: "Directorio general",
    description:
      "Crea cuentas, consulta roles y controla el estado de acceso de cada persona.",
    icon: Users,
  },
  {
    href: "/admin/trainers",
    title: "Trainers",
    eyebrow: "Equipo profesional",
    description:
      "Consulta los entrenadores registrados y crea nuevos accesos de trainer.",
    icon: Dumbbell,
  },
  {
    href: "/admin/assignments",
    title: "Asignaciones",
    eyebrow: "Relaciones activas",
    description:
      "Vincula clientes con entrenadores o transfiere un cliente a otro trainer.",
    icon: Workflow,
  },
] as const;

export default async function AdminPage() {
  const { users, error } = await listAdminUsers();
  const trainerCount = users.filter((user) => user.role === "trainer").length;
  const clientCount = users.filter((user) => user.role === "client").length;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-2xl bg-surface-inverse text-surface-inverse-foreground shadow-raised">
          <div className="grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="font-mono text-label font-bold uppercase tracking-label text-primary">
                PRTracker / Administración
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Centro de control
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                Gestiona las cuentas y las relaciones operativas del equipo
                desde un único punto de entrada.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <Stat label="Usuarios" value={users.length} />
              <Stat label="Trainers" value={trainerCount} />
              <Stat label="Clientes" value={clientCount} />
            </dl>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-destructive">
            <p className="font-bold">No fue posible cargar los indicadores</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : null}

        <section aria-labelledby="admin-sections-title" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label font-bold uppercase tracking-label text-accent-foreground">
                Secciones
              </p>
              <h2
                className="mt-1 text-2xl font-black tracking-tight"
                id="admin-sections-title"
              >
                ¿Qué necesitas gestionar?
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {sections.length} áreas disponibles
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Link
                  className="group flex min-h-64 flex-col rounded-2xl border border-border-strong bg-card p-6 text-card-foreground shadow-raised transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={section.href}
                  key={section.href}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-mono text-3xl font-black text-border-strong">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-6 font-mono text-label font-bold uppercase tracking-label text-accent-foreground">
                    {section.eyebrow}
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-black text-accent-foreground">
                    Abrir sección
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 bg-card px-4 py-3 text-card-foreground sm:min-w-28">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black">{value}</dd>
    </div>
  );
}

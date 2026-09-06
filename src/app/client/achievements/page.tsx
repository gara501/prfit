import { ArrowRight, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { BadgeGallery } from "@/components/gamification/BadgeGallery";
import { getClientGamification } from "@/lib/gamification/queries";
import { STREAK_LEVELS } from "@/lib/gamification/streak";

export default async function ClientAchievementsPage() {
  const { summary, error } = await getClientGamification();

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-label font-black uppercase tracking-label text-accent-foreground">
              Adherencia
            </p>
            <h1 className="mt-3 text-title font-black tracking-tight">
              Racha y medallas
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Cada jornada representa un día programado completado. Los
              descansos y las cancelaciones no interrumpen tu avance.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-primary-foreground transition-colors hover:bg-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/client/sessions"
          >
            Ir a entrenar
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        {error ? (
          <p className="mt-6 rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-sm font-bold text-destructive">
            No fue posible cargar tus logros: {error}
          </p>
        ) : null}

        <section className="my-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <Metric
            icon="flame"
            label="Racha actual"
            value={summary.currentStreak}
          />
          <Metric
            icon="trophy"
            label="Mejor racha"
            value={summary.bestStreak}
          />
          <Metric
            icon="trophy"
            label="Medallas obtenidas"
            value={
              STREAK_LEVELS.filter(
                (level) => summary.bestStreak >= level.threshold,
              ).length
            }
          />
        </section>

        {!summary.hasSchedule && !error ? (
          <p className="mb-8 rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
            Tu entrenador aún no ha programado jornadas. Las medallas comenzarán
            a contar desde la primera programación.
          </p>
        ) : null}

        <section aria-labelledby="badge-collection-title">
          <div className="mb-5">
            <p className="font-mono text-label font-black uppercase tracking-label text-accent-foreground">
              Colección
            </p>
            <h2
              className="mt-1 text-2xl font-black"
              id="badge-collection-title"
            >
              Tus niveles de cumplimiento
            </h2>
          </div>
          <BadgeGallery summary={summary} />
        </section>

        <aside className="mt-8 border-l-4 border-primary bg-card px-5 py-4 text-sm leading-6 text-muted-foreground">
          Una jornada omitida o vencida rompe la racha actual. Las medallas ya
          obtenidas y tu mejor marca permanecen en el historial.
        </aside>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: "flame" | "trophy";
  label: string;
  value: number;
}) {
  const Icon = icon === "flame" ? Flame : Trophy;
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        <p className="font-mono text-label font-black uppercase tracking-label">
          {label}
        </p>
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

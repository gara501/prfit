import { CalendarCheck2, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { BadgeArtwork } from "@/components/gamification/BadgeArtwork";
import {
  type GamificationSummary,
  STREAK_LEVELS,
} from "@/lib/gamification/streak";
import { cn } from "@/lib/utils";

export function StreakSummary({
  summary,
  compact = false,
}: {
  summary: GamificationSummary;
  compact?: boolean;
}) {
  const displayLevel = summary.currentLevel ?? STREAK_LEVELS[0];

  if (!summary.hasSchedule) {
    return (
      <section className="rounded-xl border border-border bg-card p-card text-card-foreground">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <CalendarCheck2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-mono text-label font-black uppercase text-accent-foreground">
              Racha de cumplimiento
            </p>
            <h2 className="mt-1 text-xl font-black">
              Aún no hay una programación
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              La racha comenzará cuando tu entrenador programe tus jornadas de
              entrenamiento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const title = summary.currentLevel
    ? `Medalla ${summary.currentLevel.name}`
    : "Primera medalla en camino";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface-inverse text-surface-inverse-foreground",
        compact ? "p-5" : "p-6 sm:p-8",
      )}
    >
      <div
        className={cn(
          "grid items-center gap-6",
          compact ? "sm:grid-cols-[auto_1fr]" : "lg:grid-cols-[12rem_1fr]",
        )}
      >
        <BadgeArtwork
          className={cn(compact ? "mx-auto w-28" : "mx-auto w-40 sm:w-48")}
          level={displayLevel}
          priority={!compact}
          unlocked={summary.currentLevel !== null}
        />

        <div>
          <p className="font-mono text-label font-black uppercase tracking-label text-accent-foreground">
            Racha de cumplimiento
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="flex items-center gap-2">
              <Flame aria-hidden="true" className="size-7 text-primary" />
              <span className="text-5xl font-black tracking-tight">
                {summary.currentStreak}
              </span>
              <span className="pb-1 text-sm font-bold text-surface-inverse-foreground/70">
                {summary.currentStreak === 1 ? "jornada" : "jornadas"}
              </span>
            </p>
            <p className="pb-1 text-sm font-bold text-surface-inverse-foreground/70">
              Mejor racha: {summary.bestStreak}
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Trophy aria-hidden="true" className="size-4 text-primary" />
            <h2 className="font-black">{title}</h2>
          </div>

          {summary.nextLevel ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-4 text-xs font-bold text-surface-inverse-foreground/70">
                <span>Siguiente: {summary.nextLevel.name}</span>
                <span>
                  {summary.currentStreak}/{summary.nextLevel.threshold}
                </span>
              </div>
              <div
                aria-label={`Progreso hacia la medalla ${summary.nextLevel.name}`}
                aria-valuemax={summary.nextLevel.threshold}
                aria-valuemin={0}
                aria-valuenow={Math.min(
                  summary.currentStreak,
                  summary.nextLevel.threshold,
                )}
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-inverse-foreground/15"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${summary.nextLevelProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-surface-inverse-foreground/60">
                {summary.remainingForNextLevel} jornadas consecutivas por
                completar.
                {summary.pendingToday
                  ? " La jornada de hoy aún está abierta."
                  : ""}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-surface-inverse-foreground/70">
              Alcanzaste el nivel máximo de adherencia.
            </p>
          )}

          {!compact ? (
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-surface-inverse-foreground/25 px-4 text-sm font-black transition-colors hover:bg-surface-inverse-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/client/achievements"
            >
              Ver todas las medallas
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

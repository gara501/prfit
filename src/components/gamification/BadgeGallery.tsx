import { Check, LockKeyhole } from "lucide-react";
import { BadgeArtwork } from "@/components/gamification/BadgeArtwork";
import {
  type GamificationSummary,
  STREAK_LEVELS,
} from "@/lib/gamification/streak";

export function BadgeGallery({ summary }: { summary: GamificationSummary }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {STREAK_LEVELS.map((level) => {
        const unlocked = summary.bestStreak >= level.threshold;
        return (
          <li
            className="relative overflow-hidden rounded-xl border border-border bg-card p-5 text-card-foreground"
            key={level.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-label font-black uppercase tracking-label text-accent-foreground">
                {level.threshold} jornadas
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                {unlocked ? (
                  <Check aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <LockKeyhole aria-hidden="true" className="size-4" />
                )}
                {unlocked ? "Desbloqueada" : "Bloqueada"}
              </span>
            </div>
            <BadgeArtwork
              className="mx-auto my-3 w-36 sm:w-40"
              level={level}
              unlocked={unlocked}
            />
            <h2 className="text-xl font-black">{level.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {level.description}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

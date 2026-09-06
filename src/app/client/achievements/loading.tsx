import { Skeleton } from "@/components/ui/skeleton";

const badgeSkeletons = [
  "impulso",
  "constancia",
  "disciplina",
  "fortaleza",
  "elite",
  "leyenda",
] as const;

export default function ClientAchievementsLoading() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {badgeSkeletons.map((badge) => (
            <Skeleton className="h-80 rounded-xl" key={badge} />
          ))}
        </div>
      </div>
    </main>
  );
}

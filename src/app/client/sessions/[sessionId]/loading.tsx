import { Skeleton } from "@/components/ui/skeleton";

export default function LiveSessionLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando entrenamiento"
      className="min-h-[calc(100vh-5rem)] bg-surface-inverse pb-32 text-surface-inverse-foreground"
    >
      <header className="border-b border-border-strong/30 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-4 w-28 bg-muted-foreground/25" />
          <Skeleton className="h-8 w-64 max-w-full bg-muted-foreground/25" />
          <Skeleton className="h-2 w-full bg-muted-foreground/25" />
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8">
        <section className="rounded-xl bg-card p-5 sm:p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-56 max-w-full" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </section>
        <Skeleton className="h-40 bg-muted-foreground/20" />
        <Skeleton className="h-40 bg-muted-foreground/20" />
      </div>
    </main>
  );
}

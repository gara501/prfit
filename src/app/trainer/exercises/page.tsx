import { Dumbbell, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteExerciseButton } from "@/components/exercises/DeleteExerciseButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  buildExercisesHref,
  parseExercisePage,
} from "@/lib/exercises/pagination";
import { getPaginatedExercises } from "@/lib/exercises/queries";

export default async function TrainerExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    page?: string;
    q?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const requestedPage = parseExercisePage(params.page);
  const result = await getPaginatedExercises(requestedPage, query);

  if (!result.error && requestedPage > result.pageCount) {
    redirect(buildExercisesHref(result.pageCount, query));
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-label font-bold uppercase tracking-label text-accent-foreground">
              Planificación / Catálogo
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              Ejercicios
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Administra los movimientos disponibles al construir rutinas y
              plantillas.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/trainer/exercises/new"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo ejercicio
          </Link>
        </header>

        {params.success ? (
          <Alert className="mb-6 border-success/35 bg-success/10 text-success">
            <AlertTitle>Cambios guardados</AlertTitle>
            <AlertDescription>{params.success}</AlertDescription>
          </Alert>
        ) : null}
        {params.error ? (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>No pudimos completar la acción</AlertTitle>
            <AlertDescription>{params.error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex w-full gap-2 sm:max-w-lg" method="get">
            <label
              className="relative min-w-0 flex-1"
              htmlFor="exercise-search"
            >
              <span className="sr-only">Buscar ejercicio</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                defaultValue={query}
                id="exercise-search"
                name="q"
                placeholder="Buscar por nombre"
                type="search"
              />
            </label>
            <button
              className="min-h-11 rounded-xl border border-border-strong bg-card px-4 text-sm font-black text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="submit"
            >
              Buscar
            </button>
          </form>
          <p className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {result.total} {result.total === 1 ? "ejercicio" : "ejercicios"}
          </p>
        </section>

        {result.error ? (
          <Alert variant="destructive">
            <AlertTitle>No pudimos cargar el catálogo</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        ) : result.exercises.length === 0 ? (
          <EmptyCatalog hasSearch={Boolean(query)} />
        ) : (
          <>
            <section
              aria-label="Listado de ejercicios"
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              {result.exercises.map((exercise) => (
                <article
                  className="grid gap-4 border-b border-border p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
                  key={exercise.id}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
                    >
                      <Dumbbell className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black text-card-foreground">
                        {exercise.name}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {exercise.bodyZones.map((zone) => (
                          <span
                            className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground"
                            key={zone.id}
                          >
                            {zone.name}
                          </span>
                        ))}
                        {exercise.equipment.map((item) => (
                          <span
                            className="rounded-full border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground"
                            key={item.id}
                          >
                            {item.name}
                          </span>
                        ))}
                        {!exercise.bodyZones.length &&
                        !exercise.equipment.length ? (
                          <span className="text-xs text-muted-foreground">
                            Sin clasificación
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <Link
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={`/trainer/exercises/${exercise.id}/edit`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Editar
                    </Link>
                    <DeleteExerciseButton
                      exerciseId={exercise.id}
                      exerciseName={exercise.name}
                    />
                  </div>
                </article>
              ))}
            </section>

            <Pagination
              currentPage={result.page}
              pageCount={result.pageCount}
              query={query}
            />
          </>
        )}
      </div>
    </main>
  );
}

function EmptyCatalog({ hasSearch }: { hasSearch: boolean }) {
  return (
    <section className="rounded-2xl border border-dashed border-border-strong bg-card px-6 py-14 text-center">
      <Dumbbell
        aria-hidden="true"
        className="mx-auto size-8 text-muted-foreground"
      />
      <h2 className="mt-4 text-xl font-black text-card-foreground">
        {hasSearch ? "No encontramos coincidencias" : "El catálogo está vacío"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasSearch
          ? "Prueba con otro nombre o limpia el filtro de búsqueda."
          : "Crea el primer ejercicio para comenzar a construir rutinas."}
      </p>
      <Link
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground"
        href={hasSearch ? "/trainer/exercises" : "/trainer/exercises/new"}
      >
        {hasSearch ? "Limpiar búsqueda" : "Crear ejercicio"}
      </Link>
    </section>
  );
}

function Pagination({
  currentPage,
  pageCount,
  query,
}: {
  currentPage: number;
  pageCount: number;
  query: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="Paginación de ejercicios"
      className="mt-6 flex items-center justify-between gap-4"
    >
      <PaginationLink
        disabled={currentPage <= 1}
        href={buildExercisesHref(currentPage - 1, query)}
        label="← Anterior"
      />
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Página {currentPage} de {pageCount}
      </p>
      <PaginationLink
        disabled={currentPage >= pageCount}
        href={buildExercisesHref(currentPage + 1, query)}
        label="Siguiente →"
      />
    </nav>
  );
}

function PaginationLink({
  disabled,
  href,
  label,
}: {
  disabled: boolean;
  href: string;
  label: string;
}) {
  return disabled ? (
    <span
      aria-disabled="true"
      className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-black text-muted-foreground opacity-50"
    >
      {label}
    </span>
  ) : (
    <Link
      className="inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-card px-4 text-sm font-black text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
    >
      {label}
    </Link>
  );
}

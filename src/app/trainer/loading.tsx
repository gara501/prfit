export default function TrainerLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando dashboard de entrenador"
      className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-page-inline py-page-block"
    >
      <div className="mx-auto max-w-[90rem] animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="mt-4 h-11 max-w-xl rounded bg-muted" />
        <div className="mt-3 h-5 max-w-2xl rounded bg-muted" />
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="border border-border bg-card p-5">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-4 h-11 rounded bg-muted sm:w-80" />
            <div className="mt-6 h-56 rounded bg-muted" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="h-44 rounded bg-muted" />
              <div className="h-44 rounded bg-muted" />
            </div>
          </section>
          <aside className="h-72 rounded-3xl bg-surface-inverse" />
        </div>
        <output className="sr-only">Cargando dashboard del entrenador.</output>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-page-inline py-page-block text-foreground">
      <section className="w-full max-w-md border border-border bg-card p-6 text-card-foreground shadow-raised sm:p-8">
        <p className="font-mono text-label font-black uppercase text-accent-foreground">
          PRFit sin conexión
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">
          Necesitas conexión para continuar
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Comprueba tu conexión e inténtalo de nuevo. Por seguridad, los datos
          de clientes no se guardan en la caché del dispositivo.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          Reintentar
        </Link>
      </section>
    </main>
  );
}

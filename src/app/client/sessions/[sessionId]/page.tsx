import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveWorkoutRunner } from "@/components/sessions/LiveWorkoutRunner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getLiveWorkoutSession } from "@/lib/sessions/queries";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { session, error } = await getLiveWorkoutSession(sessionId);
  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl px-page-inline py-page-block">
        <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
          Sesión de entrenamiento
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          No pudimos cargar el entrenamiento
        </h1>
        <Alert className="mt-6" variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>La sesión no está disponible</AlertTitle>
          <AlertDescription>
            Vuelve a intentarlo. Tus registros anteriores no se han modificado.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={`/client/sessions/${sessionId}`}
          >
            Reintentar
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/client/sessions"
          >
            Volver a mis sesiones
          </Link>
        </div>
      </main>
    );
  }
  if (!session) notFound();
  return <LiveWorkoutRunner initialSession={session} />;
}

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ExerciseEditorData } from "@/lib/exercises/types";
import { ExerciseForm } from "./ExerciseForm";

export function ExerciseEditorShell({
  data,
  error,
}: {
  data: ExerciseEditorData | null;
  error: string | null;
}) {
  const isEditing = Boolean(data?.exercise);

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-border pb-7">
          <Link
            className="text-sm font-black text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/trainer/exercises"
          >
            ← Volver al catálogo
          </Link>
          <p className="mt-6 font-mono text-label font-bold uppercase tracking-label text-accent-foreground">
            Catálogo / {isEditing ? "Edición" : "Nuevo"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {isEditing ? "Editar ejercicio" : "Crear ejercicio"}
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            Define la información que aparecerá al diseñar rutinas y consultar
            sesiones.
          </p>
        </header>

        {error || !data ? (
          <Alert variant="destructive">
            <AlertTitle>No pudimos abrir el editor</AlertTitle>
            <AlertDescription>
              {error ?? "No encontramos la información solicitada."}
            </AlertDescription>
          </Alert>
        ) : (
          <ExerciseForm
            bodyZones={data.bodyZones}
            equipment={data.equipment}
            exercise={data.exercise}
          />
        )}
      </div>
    </main>
  );
}

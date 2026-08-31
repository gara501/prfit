import Link from "next/link";
import { savePassword } from "@/app/(auth)/password/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export function PasswordPage({
  mode,
  error,
}: {
  mode: "reset" | "setup";
  error?: string;
}) {
  const isSetup = mode === "setup";
  const returnTo = isSetup ? "/auth/setup-password" : "/auth/reset-password";

  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-4 py-10">
      <section className="w-full max-w-md border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
          {isSetup ? "Configuración de cuenta" : "Recuperar acceso"}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {isSetup ? "Crea tu contraseña" : "Define una nueva contraseña"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Usa al menos 8 caracteres. Esta contraseña te permitirá acceder a
          PRTracker.
        </p>
        <Alert className="mt-6">
          <AlertTitle>Enlace seguro</AlertTitle>
          <AlertDescription>
            Esta página requiere una sesión creada desde tu invitación o enlace
            de recuperación.
          </AlertDescription>
        </Alert>
        {error ? (
          <Alert className="mt-4" variant="destructive">
            <AlertTitle>No fue posible guardar la contraseña</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form action={savePassword} className="mt-6 space-y-4">
          <input name="returnTo" type="hidden" value={returnTo} />
          <label
            className="block text-sm font-bold text-foreground"
            htmlFor="password"
          >
            Nueva contraseña
            <Input
              autoComplete="new-password"
              className="mt-2"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label
            className="block text-sm font-bold text-foreground"
            htmlFor="confirmation"
          >
            Confirmar contraseña
            <Input
              autoComplete="new-password"
              className="mt-2"
              id="confirmation"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </label>
          <button
            className="w-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            type="submit"
          >
            Guardar contraseña
          </button>
        </form>
        <Link
          className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          href="/login"
        >
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}

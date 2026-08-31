import Link from "next/link";
import { requestPasswordReset } from "@/app/(auth)/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-4 py-10">
      <section className="w-full max-w-md border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
          Recuperar acceso
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Restablecer contraseña
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Te enviaremos un enlace si el correo corresponde a una cuenta.
        </p>

        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertTitle>No fue posible enviar el enlace</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {sent ? (
          <Alert className="mt-6">
            <AlertTitle>Revisa tu correo</AlertTitle>
            <AlertDescription>
              Si existe una cuenta asociada, recibirá un enlace para restablecer
              la contraseña.
            </AlertDescription>
          </Alert>
        ) : null}

        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <label
            className="block text-sm font-bold text-foreground"
            htmlFor="email"
          >
            Correo electrónico
            <Input
              autoComplete="email"
              className="mt-2"
              id="email"
              name="email"
              required
              type="email"
            />
          </label>
          <button
            className="w-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            type="submit"
          >
            Enviar enlace
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

import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoginSubmitButton } from "@/components/auth/LoginSubmitButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="grid min-h-screen bg-surface-subtle lg:grid-cols-[minmax(19rem,0.8fr)_minmax(32rem,1.2fr)]">
      <section className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-surface-inverse px-6 py-7 text-surface-inverse-foreground sm:px-10 lg:min-h-screen lg:px-12 lg:py-12">
        <ThemeToggle
          className="absolute right-5 top-5 sm:right-8 sm:top-8"
          variant="inverse"
        />
        <div className="flex items-center gap-3">
          <Image
            alt=""
            aria-hidden="true"
            className="size-11 rounded-lg object-cover"
            height={44}
            priority
            src="/logo.svg"
            width={44}
          />
          <div>
            <p className="text-lg font-extrabold tracking-tight">PRTracker</p>
            <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
              Sistema de entrenamiento
            </p>
          </div>
        </div>
        <div className="mt-10 max-w-sm border-l-2 border-primary pl-5 lg:mt-0">
          <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
            Acceso privado
          </p>
          <p className="mt-2 text-lg font-semibold leading-7 sm:text-xl">
            Gestión de rutinas, sesiones y progreso.
          </p>
        </div>
      </section>

      <section className="flex items-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="font-mono text-label font-bold uppercase tracking-label text-muted-foreground">
            Acceso al sistema
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Iniciar sesión
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Usa las credenciales asignadas a tu cuenta.
          </p>

          {error ? (
            <Alert className="mt-6" variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>No fue posible iniciar sesión</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {message ? (
            <Alert className="mt-6">
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <form action={login} className="mt-7 space-y-5">
            <div className="space-y-2">
              <label
                className="text-sm font-bold text-foreground"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="nombre@correo.com"
                required
                type="email"
              />
              <Link
                className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                href="/auth/forgot-password"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-bold text-foreground"
                htmlFor="password"
              >
                Contraseña
              </label>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                required
                type="password"
              />
            </div>
            <LoginSubmitButton />
          </form>
        </div>
      </section>
    </main>
  );
}

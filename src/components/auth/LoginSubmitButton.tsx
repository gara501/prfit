"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useFormStatus } from "react-dom";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LogIn aria-hidden="true" className="size-4" />
      )}
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

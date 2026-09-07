"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ClientSelector({
  clients,
  selectedClientId,
}: {
  clients: Array<{ id: string; label: string }>;
  selectedClientId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <div className="mt-4 min-w-0 sm:mt-0 sm:w-80">
      <label className="block text-sm font-black" htmlFor="client-selector">
        Cliente
      </label>
      <div className="relative">
        <select
          aria-busy={isPending}
          className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={selectedClientId}
          id="client-selector"
          disabled={isPending}
          onChange={(event) =>
            startTransition(() =>
              router.push(`/trainer?client=${event.target.value}`),
            )
          }
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </select>
        {isPending ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary motion-reduce:animate-none"
          />
        ) : null}
      </div>
      <p
        aria-live="polite"
        className="mt-2 min-h-4 text-xs text-muted-foreground"
      >
        {isPending ? "Cargando ficha del cliente…" : ""}
      </p>
    </div>
  );
}

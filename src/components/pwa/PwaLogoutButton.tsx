"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { logout } from "@/lib/auth/actions";

async function clearPwaCaches() {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("prfit-"))
        .map((name) => caches.delete(name)),
    );
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: "CLEAR_PWA_CACHE",
    });
  }
}

export function PwaLogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await clearPwaCaches();
    } finally {
      await logout();
    }
  }

  return (
    <button
      aria-label="Cerrar sesión"
      className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      disabled={isPending}
      onClick={() => void handleLogout()}
      title="Cerrar sesión"
      type="button"
    >
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}

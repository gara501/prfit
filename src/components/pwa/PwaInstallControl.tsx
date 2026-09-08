"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const dismissalKey = "prfit-install-dismissed-at";
const dismissalDuration = 7 * 24 * 60 * 60 * 1000;

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window as Window & { MSStream?: unknown }).MSStream;

export function PwaInstallControl() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [canShowIosInstructions, setCanShowIosInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());
    setCanShowIosInstructions(isIos() && !isInstalled());
    const dismissedAt = Number(window.localStorage.getItem(dismissalKey));
    setIsDismissed(
      Number.isFinite(dismissedAt) &&
        Date.now() - dismissedAt < dismissalDuration,
    );

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (installed || isDismissed || (!deferredPrompt && !canShowIosInstructions))
    return null;

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        window.localStorage.removeItem(dismissalKey);
        setInstalled(true);
      } else {
        window.localStorage.setItem(dismissalKey, String(Date.now()));
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
      return;
    }
    setShowIosInstructions(true);
  }

  return (
    <div className="relative">
      <button
        aria-expanded={showIosInstructions}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-black text-card-foreground transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => void install()}
        type="button"
      >
        {canShowIosInstructions ? (
          <Share aria-hidden="true" className="size-4" />
        ) : (
          <Download aria-hidden="true" className="size-4" />
        )}
        Instalar
      </button>

      {showIosInstructions ? (
        <div
          aria-live="polite"
          className="absolute right-0 top-full z-50 mt-2 w-72 border border-border bg-card p-4 text-sm text-card-foreground shadow-overlay"
        >
          <p className="font-black">Instala PRFit en tu iPhone</p>
          <p className="mt-2 leading-5 text-muted-foreground">
            Toca Compartir en Safari y elige “Añadir a pantalla de inicio”.
          </p>
        </div>
      ) : null}
    </div>
  );
}

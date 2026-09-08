"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function WorkoutConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <output className="mt-4 flex items-start gap-2 border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-surface-inverse-foreground">
      <WifiOff
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-warning"
      />
      <p>
        Sin conexión. Los cambios de esta sesión requieren internet para
        guardarse.
      </p>
    </output>
  );
}

"use client";

import { CirclePlay, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/exercises/youtube";
import { cn } from "@/lib/utils";

type ExerciseVideoButtonProps = {
  exerciseName: string;
  videoUrl: string;
  className?: string;
};

export function ExerciseVideoButton({
  exerciseName,
  videoUrl,
  className,
}: ExerciseVideoButtonProps) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  if (!embedUrl) return null;

  return (
    <>
      <button
        aria-label={`Ver video de ejemplo de ${exerciseName}`}
        className={cn(
          "inline-grid size-11 shrink-0 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        onClick={() => setIsOpen(true)}
        title="Ver video de ejemplo"
        type="button"
      >
        <CirclePlay aria-hidden="true" className="size-5" />
      </button>

      <dialog
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,56rem)] rounded-xl border border-border bg-card p-0 text-card-foreground shadow-overlay backdrop:bg-slate-950/80"
        onCancel={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <h2 className="min-w-0 truncate text-base font-bold" id={titleId}>
            {exerciseName}
          </h2>
          <button
            aria-label="Cerrar video"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {isOpen ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embedUrl}
              title={`Video de ejemplo de ${exerciseName}`}
            />
          </div>
        ) : null}
      </dialog>
    </>
  );
}

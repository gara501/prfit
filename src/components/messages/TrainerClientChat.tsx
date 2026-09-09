"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTrainerClientMessages } from "@/hooks/useTrainerClientMessages";
import type { ChatMessage } from "@/lib/messages/types";

export function TrainerClientChat({
  currentUserId,
  trainerId,
  clientId,
  contactName,
  initialMessages,
}: {
  currentUserId: string;
  trainerId: string;
  clientId: string;
  contactName: string;
  initialMessages: ChatMessage[];
}) {
  const [draft, setDraft] = useState("");
  const {
    messages,
    isSending,
    error,
    send,
    markIncomingAsRead,
    hasOlder,
    loadingOlder,
    loadOlder,
  } = useTrainerClientMessages({
    currentUserId,
    trainerId,
    clientId,
    initialMessages,
  });
  const listEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void markIncomingAsRead();
  }, [markIncomingAsRead]);
  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    if (lastMessageId) {
      listEndRef.current?.scrollIntoView?.({ block: "end" });
    }
  }, [lastMessageId]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await send(draft)) setDraft("");
  };
  return (
    <section
      aria-label={`Conversación con ${contactName}`}
      className="flex min-h-[calc(100dvh-13rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-raised"
    >
      <header className="border-b border-border px-5 py-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
          Conversación segura
        </p>
        <h1 className="mt-1 text-xl font-black tracking-tight">
          {contactName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los mensajes quedan registrados para tu historial y auditoría.
        </p>
      </header>
      <div
        aria-live="polite"
        className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface-subtle px-4 py-5 sm:px-6"
      >
        {hasOlder ? (
          <button
            type="button"
            disabled={loadingOlder}
            onClick={() => void loadOlder()}
            className="min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-bold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {loadingOlder ? "Cargando…" : "Cargar mensajes anteriores"}
          </button>
        ) : null}
        {messages.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              own={message.senderId === currentUserId}
            />
          ))
        ) : (
          <p className="m-auto max-w-sm text-center text-sm leading-6 text-muted-foreground">
            Aún no hay mensajes. Inicia la conversación cuando lo necesites.
          </p>
        )}
        <div ref={listEndRef} />
      </div>
      <form
        className="border-t border-border bg-card p-3 sm:p-4"
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="chat-message">
          Escribe un mensaje
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4000}
            rows={2}
            placeholder="Escribe un mensaje…"
            disabled={isSending}
            className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            aria-label="Enviar mensaje"
            disabled={!draft.trim() || isSending}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            <SendHorizontal aria-hidden="true" className="size-4" />
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function MessageBubble({
  message,
  own,
}: {
  message: ChatMessage;
  own: boolean;
}) {
  return (
    <article
      className={
        own
          ? "ml-auto max-w-[85%] sm:max-w-[70%]"
          : "mr-auto max-w-[85%] sm:max-w-[70%]"
      }
    >
      <div
        className={
          own
            ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-5 text-primary-foreground"
            : "rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-2.5 text-sm leading-5 text-foreground"
        }
      >
        {message.body}
      </div>
      <p
        className={
          own
            ? "mt-1 text-right font-mono text-[10px] text-muted-foreground"
            : "mt-1 font-mono text-[10px] text-muted-foreground"
        }
      >
        {new Intl.DateTimeFormat("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(message.sentAt))}
        {own && message.readAt ? " · Leído" : ""}
      </p>
    </article>
  );
}

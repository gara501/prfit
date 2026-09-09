"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/messages/types";
import { createClient } from "@/lib/supabase/client";

export function useTrainerClientMessages({
  currentUserId,
  trainerId,
  clientId,
  initialMessages,
}: {
  currentUserId: string;
  trainerId: string;
  clientId: string;
  initialMessages: ChatMessage[];
}) {
  const [supabase] = useState(createClient);
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || isSending) return false;
      setIsSending(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("trainer_client_messages")
        .insert({
          trainer_id: trainerId,
          client_id: clientId,
          sender_id: currentUserId,
          body: trimmed,
        })
        .select("id, body, sender_id, sent_at, read_at")
        .single();
      setIsSending(false);
      if (insertError || !data) {
        setError(insertError?.message ?? "No fue posible enviar el mensaje.");
        return false;
      }
      setMessages((current) =>
        current.some((message) => message.id === data.id)
          ? current
          : [
              ...current,
              {
                id: data.id,
                body: data.body,
                senderId: data.sender_id,
                sentAt: data.sent_at,
                readAt: data.read_at,
              },
            ],
      );
      return true;
    },
    [clientId, currentUserId, isSending, supabase, trainerId],
  );
  const markMessageIdsAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!messageIds.length) return;
      const { error: updateError } = await supabase
        .from("trainer_client_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", messageIds)
        .is("read_at", null);
      if (!updateError) {
        setMessages((current) =>
          current.map((message) =>
            messageIds.includes(message.id)
              ? { ...message, readAt: new Date().toISOString() }
              : message,
          ),
        );
        window.dispatchEvent(new Event("cardonafit:messages-read"));
      }
    },
    [supabase],
  );
  const markIncomingAsRead = useCallback(async () => {
    const unreadIds = messages
      .filter(
        (message) => message.senderId !== currentUserId && !message.readAt,
      )
      .map((message) => message.id);
    await markMessageIdsAsRead(unreadIds);
  }, [currentUserId, markMessageIdsAsRead, messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`trainer-client-messages:${trainerId}:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trainer_client_messages",
          filter: `trainer_id=eq.${trainerId},client_id=eq.${clientId}`,
        },
        (payload) => {
          const message = payload.new as {
            id: string;
            body: string;
            sender_id: string;
            sent_at: string;
            read_at: string | null;
          };
          if (payload.eventType === "DELETE") return;
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current.map((item) =>
                  item.id === message.id
                    ? { ...item, readAt: message.read_at }
                    : item,
                )
              : [
                  ...current,
                  {
                    id: message.id,
                    body: message.body,
                    senderId: message.sender_id,
                    sentAt: message.sent_at,
                    readAt: message.read_at,
                  },
                ],
          );
          if (message.sender_id !== currentUserId && !message.read_at) {
            void markMessageIdsAsRead([message.id]);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId, currentUserId, markMessageIdsAsRead, supabase, trainerId]);
  const [hasOlder, setHasOlder] = useState(initialMessages.length === 100);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadOlder = async () => {
    const oldest = messages[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    const { data, error: loadError } = await supabase
      .from("trainer_client_messages")
      .select("id,body,sender_id,sent_at,read_at")
      .eq("trainer_id", trainerId)
      .eq("client_id", clientId)
      .or(
        `sent_at.lt.${oldest.sentAt},and(sent_at.eq.${oldest.sentAt},id.lt.${oldest.id})`,
      )
      .order("sent_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100);
    setLoadingOlder(false);
    if (loadError) {
      setError("No fue posible cargar mensajes anteriores.");
      return;
    }
    setHasOlder(data.length === 100);
    setMessages((current) => [
      ...data
        .toReversed()
        .filter((row) => !current.some((m) => m.id === row.id))
        .map((row) => ({
          id: row.id,
          body: row.body,
          senderId: row.sender_id,
          sentAt: row.sent_at,
          readAt: row.read_at,
        })),
      ...current,
    ]);
  };
  return {
    messages,
    isSending,
    error,
    send,
    markIncomingAsRead,
    hasOlder,
    loadingOlder,
    loadOlder,
  };
}

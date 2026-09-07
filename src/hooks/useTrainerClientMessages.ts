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
      setMessages((current) => [
        ...current,
        {
          id: data.id,
          body: data.body,
          senderId: data.sender_id,
          sentAt: data.sent_at,
          readAt: data.read_at,
        },
      ]);
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
        .in("id", messageIds);
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
          event: "INSERT",
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
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
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
  return { messages, isSending, error, send, markIncomingAsRead };
}

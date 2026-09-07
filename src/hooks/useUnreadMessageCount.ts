"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadMessageCount(userId: string, enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const load = async () => {
      const { count: unread } = await supabase
        .from("trainer_client_messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", userId)
        .is("read_at", null);
      setCount(unread ?? 0);
    };
    void load();
    const channel = supabase
      .channel(`unread-message-count:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trainer_client_messages",
        },
        () => void load(),
      )
      .subscribe();
    window.addEventListener("focus", load);
    window.addEventListener("cardonafit:messages-read", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("cardonafit:messages-read", load);
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  return count;
}

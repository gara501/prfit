"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import type { AppRole } from "@/lib/auth/roles";

export function MessageNotificationBell({
  userRole,
  userId,
}: {
  userRole: AppRole;
  userId: string;
}) {
  const count = useUnreadMessageCount(userId, userRole !== "admin");
  const href =
    userRole === "trainer" ? "/trainer/messages" : "/client/messages";
  if (userRole === "admin") return null;
  return (
    <Link
      aria-label={count ? `${count} mensajes sin leer` : "Mensajes"}
      className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
      title="Mensajes"
    >
      <Bell aria-hidden="true" className="size-4" />
      {count ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 py-0.5 font-mono text-[10px] font-black leading-none text-primary-foreground"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

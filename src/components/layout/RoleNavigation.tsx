"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";

type NavigationItem = {
  href: string;
  label: string;
  icon:
    | "users"
    | "routines"
    | "sessions"
    | "connections"
    | "measurements"
    | "history"
    | "progression"
    | "calendar"
    | "profile";
};

const roleNavigation: Record<AppRole, NavigationItem[]> = {
  admin: [
    { href: "/admin/users", label: "Usuarios", icon: "users" },
    { href: "/admin/trainers", label: "Trainers", icon: "routines" },
    {
      href: "/admin/assignments",
      label: "Asignaciones",
      icon: "connections",
    },
  ],
  trainer: [
    { href: "/trainer/routines", label: "Rutinas", icon: "routines" },
    { href: "/trainer/clients", label: "Clientes", icon: "connections" },
    {
      href: "/trainer/measurements",
      label: "Mediciones",
      icon: "measurements",
    },
    { href: "/trainer/history", label: "Historial", icon: "history" },
    { href: "/trainer/progressions", label: "Progresión", icon: "progression" },
    { href: "/trainer/calendar", label: "Calendario", icon: "calendar" },
  ],
  client: [
    {
      href: "/client/sessions",
      label: "Mis sesiones",
      icon: "sessions",
    },
    { href: "/client/history", label: "Historial", icon: "history" },
    { href: "/client/calendar", label: "Calendario", icon: "calendar" },
  ],
};

const profileNavigation: NavigationItem = {
  href: "/profile",
  label: "Mi perfil",
  icon: "profile",
};

export function RoleNavigation({ userRole }: { userRole: AppRole }) {
  const pathname = usePathname();
  const items = [...roleNavigation[userRole], profileNavigation];

  return (
    <nav aria-label="Navegación principal" className="flex items-center gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`group relative inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
              isActive
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <NavigationIcon icon={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavigationIcon({ icon }: { icon: NavigationItem["icon"] }) {
  if (icon === "users") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 11l2 2 3-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "routines") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "sessions") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M5 3v3M19 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1ZM8 13h3v3H8v-3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "connections") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM15.5 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM11 9.5l2 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "measurements") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M4 19V9M10 19V5M16 19v-7M22 19V3M2 19h21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "history") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "progression") {
    return (
      <span aria-hidden="true" className="text-base leading-none">
        ↗
      </span>
    );
  }

  if (icon === "calendar") {
    return (
      <span aria-hidden="true" className="text-base leading-none">
        □
      </span>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
      <path
        d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

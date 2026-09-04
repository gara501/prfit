"use client";

import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  History,
  LibraryBig,
  Menu,
  Ruler,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type NavigationIconName =
  | "users"
  | "routines"
  | "exercises"
  | "sessions"
  | "connections"
  | "measurements"
  | "history"
  | "progression"
  | "calendar"
  | "profile";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: NavigationIconName;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const roleNavigation: Record<AppRole, NavigationGroup[]> = {
  admin: [
    {
      label: "Administración",
      items: [
        {
          href: "/admin/users",
          label: "Usuarios",
          description: "Gestiona las cuentas de la plataforma.",
          icon: "users",
        },
        {
          href: "/admin/trainers",
          label: "Trainers",
          description: "Consulta y administra entrenadores.",
          icon: "routines",
        },
        {
          href: "/admin/assignments",
          label: "Asignaciones",
          description: "Vincula clientes con entrenadores.",
          icon: "connections",
        },
      ],
    },
  ],
  trainer: [
    {
      label: "Planificación",
      items: [
        {
          href: "/trainer/routines",
          label: "Rutinas",
          description: "Diseña y publica planes de entrenamiento.",
          icon: "routines",
        },
        {
          href: "/trainer/exercises",
          label: "Ejercicios",
          description: "Administra el catálogo de movimientos.",
          icon: "exercises",
        },
        {
          href: "/trainer/calendar",
          label: "Calendario",
          description: "Organiza el trabajo semanal.",
          icon: "calendar",
        },
      ],
    },
    {
      label: "Clientes",
      items: [
        {
          href: "/trainer/clients",
          label: "Clientes",
          description: "Consulta fichas y asignaciones activas.",
          icon: "connections",
        },
        {
          href: "/trainer/measurements",
          label: "Mediciones",
          description: "Registra controles de composición corporal.",
          icon: "measurements",
        },
      ],
    },
    {
      label: "Rendimiento",
      items: [
        {
          href: "/trainer/history",
          label: "Historial",
          description: "Revisa las sesiones realizadas.",
          icon: "history",
        },
        {
          href: "/trainer/progressions",
          label: "Progresión",
          description: "Analiza la evolución de cargas y volumen.",
          icon: "progression",
        },
      ],
    },
  ],
  client: [
    {
      label: "Entrenamiento",
      items: [
        {
          href: "/client/sessions",
          label: "Mis sesiones",
          description: "Inicia o continúa un entrenamiento.",
          icon: "sessions",
        },
        {
          href: "/client/calendar",
          label: "Calendario",
          description: "Consulta tu planificación semanal.",
          icon: "calendar",
        },
      ],
    },
    {
      label: "Rendimiento",
      items: [
        {
          href: "/client/history",
          label: "Historial",
          description: "Compara tus sesiones y marcas anteriores.",
          icon: "history",
        },
      ],
    },
  ],
};

const profileNavigation: NavigationItem = {
  href: "/profile",
  label: "Mi perfil",
  description: "Actualiza tus datos personales.",
  icon: "profile",
};

export function RoleNavigation({ userRole }: { userRole: AppRole }) {
  const pathname = usePathname();
  const navigationId = useId();
  const navigationRef = useRef<HTMLDivElement>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groups = roleNavigation[userRole];
  const items = [...groups.flatMap((group) => group.items), profileNavigation];
  const activeItem = items.find((item) => isItemActive(pathname, item));

  useEffect(() => {
    if (!isMobileOpen && openGroup === null) return;

    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) {
        setIsMobileOpen(false);
        setOpenGroup(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileOpen(false);
      setOpenGroup(null);
    };

    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileOpen, openGroup]);

  return (
    <div className="relative w-full lg:w-auto" ref={navigationRef}>
      <nav aria-label="Navegación principal" className="lg:hidden">
        <button
          aria-controls={`${navigationId}-mobile`}
          aria-expanded={isMobileOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-black text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setIsMobileOpen((current) => !current)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Menu
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="truncate">{activeItem?.label ?? "Menú"}</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Navegar
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform",
                isMobileOpen && "rotate-180",
              )}
            />
          </span>
        </button>

        {isMobileOpen ? (
          <div
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-8.5rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-overlay"
            id={`${navigationId}-mobile`}
          >
            {groups.map((group) => (
              <section className="p-1" key={group.label}>
                <p className="px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <NavigationLink
                      item={item}
                      key={item.href}
                      onNavigate={() => setIsMobileOpen(false)}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </section>
            ))}
            <div className="mt-1 border-t border-border p-1 pt-2">
              <NavigationLink
                item={profileNavigation}
                onNavigate={() => setIsMobileOpen(false)}
                pathname={pathname}
              />
            </div>
          </div>
        ) : null}
      </nav>

      <nav
        aria-label="Navegación principal"
        className="hidden items-center gap-1 rounded-2xl border border-border bg-card p-1 lg:flex"
      >
        {groups.map((group) => {
          const isOpen = openGroup === group.label;
          const isActive = group.items.some((item) =>
            isItemActive(pathname, item),
          );

          return (
            <div className="relative" key={group.label}>
              <button
                aria-controls={`${navigationId}-${group.label}`}
                aria-expanded={isOpen}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() =>
                  setOpenGroup((current) =>
                    current === group.label ? null : group.label,
                  )
                }
                type="button"
              >
                {group.label}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-3.5 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen ? (
                <div
                  className="absolute left-0 top-[calc(100%+0.65rem)] z-50 grid w-72 gap-1 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-overlay"
                  id={`${navigationId}-${group.label}`}
                >
                  {group.items.map((item) => (
                    <NavigationLink
                      item={item}
                      key={item.href}
                      onNavigate={() => setOpenGroup(null)}
                      pathname={pathname}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        <Link
          aria-current={
            isItemActive(pathname, profileNavigation) ? "page" : undefined
          }
          className={cn(
            "grid size-10 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isItemActive(pathname, profileNavigation)
              ? "bg-surface-inverse text-surface-inverse-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          href={profileNavigation.href}
          onClick={() => setOpenGroup(null)}
          title={profileNavigation.label}
        >
          <UserRound aria-hidden="true" className="size-4" />
          <span className="sr-only">{profileNavigation.label}</span>
        </Link>
      </nav>
    </div>
  );
}

function NavigationLink({
  item,
  onNavigate,
  pathname,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
  pathname: string;
}) {
  const active = isItemActive(pathname, item);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-14 items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-surface-inverse text-surface-inverse-foreground"
          : "hover:bg-muted",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <span
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground",
          active &&
            "bg-surface-inverse-foreground/10 text-surface-inverse-foreground",
        )}
      >
        <NavigationIcon icon={item.icon} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{item.label}</span>
        <span
          className={cn(
            "mt-0.5 block text-xs leading-4 text-muted-foreground",
            active && "text-surface-inverse-foreground/70",
          )}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}

function isItemActive(pathname: string, item: NavigationItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavigationIcon({ icon }: { icon: NavigationIconName }) {
  const Icon = {
    users: UsersRound,
    routines: Dumbbell,
    exercises: LibraryBig,
    sessions: ClipboardList,
    connections: UsersRound,
    measurements: Ruler,
    history: History,
    progression: ChartNoAxesCombined,
    calendar: CalendarDays,
    profile: UserRound,
  }[icon];

  return <Icon aria-hidden="true" className="size-4" />;
}

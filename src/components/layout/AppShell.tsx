import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logout } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/roles";
import { RoleNavigation } from "./RoleNavigation";

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  trainer: "Entrenador",
  client: "Cliente",
};

const roleHome: Record<AppRole, string> = {
  admin: "/admin",
  trainer: "/trainer",
  client: "/client",
};

export function AppShell({
  children,
  userRole,
  displayName,
}: {
  children: ReactNode;
  userRole: AppRole;
  displayName: string;
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f1] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 px-4 sm:px-8 lg:min-h-20 lg:flex-nowrap lg:px-12">
          <Link
            href={roleHome[userRole]}
            className="group flex min-h-16 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="size-10 rounded-[14px] object-cover transition-transform group-hover:-rotate-3"
              height={40}
              priority
              src="/logo.svg"
              width={40}
            />
            <span>
              <span className="block text-base font-black tracking-[-0.03em]">
                PRTracker
              </span>
              <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Training system
              </span>
            </span>
          </Link>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {roleLabels[userRole]}
          </span>

          <div className="order-3 w-full overflow-x-auto border-t border-slate-100 py-2 lg:order-none lg:ml-auto lg:w-auto lg:border-0 lg:py-0">
            <RoleNavigation userRole={userRole} />
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-4 lg:border-l lg:border-slate-200 lg:pl-4">
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-xs font-bold text-slate-800">
                {displayName}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                Sesión activa
              </p>
            </div>

            <ThemeToggle />

            <form action={logout}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                >
                  <path
                    d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

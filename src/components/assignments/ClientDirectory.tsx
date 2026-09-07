"use client";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CLIENTS_PER_PAGE,
  filterClientAssignments,
  getClientDisplayName,
  getClientPage,
  getClientPageCount,
} from "@/lib/assignments/client-directory";
import type { ClientAssignment } from "@/lib/assignments/queries";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const getName = (firstName: string, lastName: string, fallback: string) =>
  `${firstName} ${lastName}`.trim() || fallback;

type ClientDirectoryProps = {
  assignments: ClientAssignment[];
  currentUserId: string;
  isAdmin: boolean;
};

export function ClientDirectory({
  assignments,
  currentUserId,
  isAdmin,
}: ClientDirectoryProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filteredAssignments = useMemo(
    () => filterClientAssignments(assignments, query),
    [assignments, query],
  );
  const pageCount = getClientPageCount(filteredAssignments.length);
  const visibleAssignments = getClientPage(filteredAssignments, page);
  const firstResult =
    filteredAssignments.length === 0 ? 0 : (page - 1) * CLIENTS_PER_PAGE + 1;
  const lastResult = Math.min(
    page * CLIENTS_PER_PAGE,
    filteredAssignments.length,
  );

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <div className="border-b border-slate-200 px-6 py-4 sm:px-7">
        <label className="sr-only" htmlFor="client-search">
          Buscar cliente por nombre o correo
        </label>
        <div className="relative max-w-xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/30"
            id="client-search"
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Buscar por nombre o correo"
            type="search"
            value={query}
          />
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <output className="block px-6 py-16 text-center">
          <p className="text-lg font-black">No encontramos clientes</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Prueba con otro nombre o correo electrónico.
          </p>
        </output>
      ) : (
        <>
          <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {visibleAssignments.map((assignment) => (
              <AssignmentRow
                assignment={assignment}
                canOpenClientDetail={
                  !isAdmin && assignment.trainerId === currentUserId
                }
                canOpenRoutine={
                  !isAdmin && assignment.trainerId === currentUserId
                }
                key={assignment.clientId}
              />
            ))}
          </ul>
          <nav
            aria-label="Paginación de clientes"
            className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
          >
            <output className="text-sm text-slate-500">
              Mostrando {firstResult}–{lastResult} de{" "}
              {filteredAssignments.length}
            </output>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:border-orange-400 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                disabled={page === 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Anterior
              </button>
              <span className="min-w-20 text-center font-mono text-xs font-bold text-slate-600">
                {page} / {pageCount}
              </span>
              <button
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:border-orange-400 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                disabled={page === pageCount}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                type="button"
              >
                Siguiente
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function AssignmentRow({
  assignment,
  canOpenRoutine,
  canOpenClientDetail,
}: {
  assignment: ClientAssignment;
  canOpenRoutine: boolean;
  canOpenClientDetail: boolean;
}) {
  const clientName = getClientDisplayName(assignment);
  const trainerName = getName(
    assignment.trainerFirstName,
    assignment.trainerLastName,
    "Entrenador sin nombre",
  );

  return (
    <li className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_20px_45px_-36px_rgba(15,23,42,0.8)]">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-base font-black text-white transition group-hover:bg-orange-500 group-hover:text-slate-950">
          {clientName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          {canOpenClientDetail ? (
            <Link
              className="block truncate text-lg font-black text-slate-900 underline-offset-4 hover:text-orange-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              href={`/trainer/clients/${assignment.clientId}`}
            >
              {clientName}
            </Link>
          ) : (
            <p className="truncate text-lg font-black text-slate-900">
              {clientName}
            </p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {assignment.assignmentId
              ? `Con ${trainerName}`
              : "Sin entrenador activo"}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
            assignment.assignmentId
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {assignment.assignmentId ? "Activo" : "Disponible"}
        </span>
      </div>

      {assignment.assignmentId ? (
        <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <ContactDetail label="Correo" value={assignment.clientEmail} />
          <ContactDetail label="Teléfono" value={assignment.clientPhone} />
        </dl>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-xs leading-5 text-slate-400">
          Los datos de contacto estarán disponibles cuando vincules este
          cliente.
        </p>
      )}

      <div className="border-t border-slate-200 pt-4 mt-4">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          Plan activo
        </p>
        {assignment.activeRoutineId && assignment.activeRoutineName ? (
          canOpenRoutine ? (
            <Link
              className="mt-1 inline-flex items-center gap-2 text-sm font-black text-orange-700 hover:text-orange-900 hover:underline"
              href={`/trainer/routines/${assignment.activeRoutineId}`}
            >
              {assignment.activeRoutineName}
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <p className="mt-1 text-sm font-black text-slate-700">
              {assignment.activeRoutineName}
            </p>
          )
        ) : (
          <p className="mt-1 text-sm font-bold text-slate-400">
            Sin rutina activa
          </p>
        )}
        {assignment.startDate ? (
          <p className="mt-2 text-[11px] text-slate-400">
            Vinculado desde{" "}
            {dateFormatter.format(new Date(assignment.startDate))}
          </p>
        ) : null}
        {canOpenClientDetail ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              href={`/trainer/clients/${assignment.clientId}`}
            >
              Abrir ficha
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-card px-4 py-2.5 text-sm font-black text-card-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={`/trainer/routines/new?client=${assignment.clientId}`}
            >
              <Plus aria-hidden="true" className="size-4" />
              Crear rutina
            </Link>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ContactDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
      <dt className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="truncate font-bold text-slate-700">
        {value || "Sin registrar"}
      </dd>
    </div>
  );
}

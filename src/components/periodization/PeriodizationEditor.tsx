"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  type PeriodizationActionState,
  savePeriodizationPlan,
} from "@/lib/periodization/actions";
import {
  type MesocycleFocus,
  type MicrocycleLoad,
  mesocycleFocusLabels,
  microcycleLoadLabels,
  type PeriodizationPlan,
} from "@/lib/periodization/types";
import type { RoutineClient } from "@/lib/routines/types";

type EditableWeek = {
  key: string;
  id: string;
  objective: string;
  loadType: MicrocycleLoad;
  volumeLevel: number;
  intensityLevel: number;
};
type EditableMesocycle = {
  key: string;
  id: string;
  name: string;
  focus: MesocycleFocus;
  objective: string;
  volumeLevel: number;
  intensityLevel: number;
  weeks: EditableWeek[];
};

const initialState: PeriodizationActionState = { status: "idle", message: "" };
const inputClass =
  "min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

const newWeek = (index: number, key = crypto.randomUUID()): EditableWeek => ({
  key,
  id: "",
  objective: `Semana ${index}`,
  loadType: "build",
  volumeLevel: 3,
  intensityLevel: 3,
});

const newMesocycle = (
  index: number,
  key = crypto.randomUUID(),
): EditableMesocycle => ({
  key,
  id: "",
  name: `Mesociclo ${index}`,
  focus: "base",
  objective: "",
  volumeLevel: 3,
  intensityLevel: 3,
  weeks: Array.from({ length: 4 }, (_, weekIndex) =>
    newWeek(weekIndex + 1, `${key}-week-${weekIndex + 1}`),
  ),
});

function initialMesocycles(
  plan: PeriodizationPlan | null,
): EditableMesocycle[] {
  if (!plan) return [newMesocycle(1, "initial-mesocycle-1")];
  return plan.mesocycles.map((mesocycle) => ({
    key: mesocycle.id,
    id: mesocycle.id,
    name: mesocycle.name,
    focus: mesocycle.focus,
    objective: mesocycle.objective,
    volumeLevel: mesocycle.volumeLevel,
    intensityLevel: mesocycle.intensityLevel,
    weeks: mesocycle.weeks.map((week) => ({
      key: week.id,
      id: week.id,
      objective: week.objective,
      loadType: week.loadType,
      volumeLevel: week.volumeLevel,
      intensityLevel: week.intensityLevel,
    })),
  }));
}

export function PeriodizationEditor({
  clients,
  defaultClientId,
  plan,
}: {
  clients: RoutineClient[];
  defaultClientId?: string;
  plan: PeriodizationPlan | null;
}) {
  const [state, formAction, isPending] = useActionState(
    savePeriodizationPlan,
    initialState,
  );
  const [mesocycles, setMesocycles] = useState(() => initialMesocycles(plan));
  const [clientId, setClientId] = useState(
    plan?.clientId ?? defaultClientId ?? "",
  );
  const [startDate, setStartDate] = useState(
    plan?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const totalWeeks = mesocycles.reduce(
    (total, mesocycle) => total + mesocycle.weeks.length,
    0,
  );
  const endDate = useMemo(() => {
    const start = new Date(`${startDate}T12:00:00`);
    if (Number.isNaN(start.getTime())) return "—";
    start.setDate(start.getDate() + totalWeeks * 7 - 1);
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(start);
  }, [startDate, totalWeeks]);
  const serialized = JSON.stringify(
    mesocycles.map((mesocycle) => ({
      id: mesocycle.id,
      name: mesocycle.name,
      focus: mesocycle.focus,
      objective: mesocycle.objective,
      volume_level: mesocycle.volumeLevel,
      intensity_level: mesocycle.intensityLevel,
      weeks: mesocycle.weeks.map((week) => ({
        id: week.id,
        objective: week.objective,
        load_type: week.loadType,
        volume_level: week.volumeLevel,
        intensity_level: week.intensityLevel,
      })),
    })),
  );

  const updateMesocycle = (
    key: string,
    update: (value: EditableMesocycle) => EditableMesocycle,
  ) =>
    setMesocycles((current) =>
      current.map((item) => (item.key === key ? update(item) : item)),
    );

  const moveMesocycle = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= mesocycles.length) return;
    setMesocycles((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-subtle px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <form action={formAction} className="mx-auto max-w-7xl">
        <input name="planId" type="hidden" value={plan?.id ?? ""} />
        <input name="mesocycles" type="hidden" value={serialized} />

        <header className="mb-8 flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={
                plan
                  ? `/trainer/periodization/${plan.id}`
                  : "/trainer/periodization"
              }
            >
              Periodización / {plan ? "Editar" : "Nuevo plan"}
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {plan ? "Ajustar macrociclo" : "Diseñar macrociclo"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ordena bloques de trabajo y define la carga semanal. Las fechas se
              calculan en secuencia desde el inicio.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-3 text-card-foreground">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Horizonte calculado
            </p>
            <p className="mt-1 font-black">
              {totalWeeks} semanas · hasta {endDate}
            </p>
          </div>
        </header>

        {state.status === "error" ? (
          <div
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive"
            role="alert"
          >
            {state.message}
          </div>
        ) : null}

        <section className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          <Field label="Nombre del plan" htmlFor="periodization-name">
            <input
              className={inputClass}
              defaultValue={plan?.name ?? ""}
              id="periodization-name"
              maxLength={120}
              name="name"
              placeholder="Temporada de fuerza"
              required
            />
          </Field>
          <Field label="Deportista" htmlFor="periodization-client">
            <select
              className={inputClass}
              disabled={Boolean(plan)}
              id="periodization-client"
              name={plan ? undefined : "clientId"}
              onChange={(event) => setClientId(event.target.value)}
              required
              value={clientId}
            >
              <option disabled value="">
                Selecciona un cliente
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {`${client.firstName} ${client.lastName}`.trim()}
                </option>
              ))}
            </select>
            {plan ? (
              <input name="clientId" type="hidden" value={clientId} />
            ) : null}
          </Field>
          <Field label="Fecha de inicio" htmlFor="periodization-start">
            <input
              className={inputClass}
              id="periodization-start"
              name="startDate"
              onChange={(event) => setStartDate(event.target.value)}
              required
              type="date"
              value={startDate}
            />
          </Field>
          <Field label="Objetivo global" htmlFor="periodization-goal">
            <input
              className={inputClass}
              defaultValue={plan?.goal ?? ""}
              id="periodization-goal"
              maxLength={2000}
              name="goal"
              placeholder="Resultado principal del ciclo"
            />
          </Field>
        </section>

        <div className="mt-8 space-y-6">
          {mesocycles.map((mesocycle, index) => {
            const priorWeeks = mesocycles
              .slice(0, index)
              .reduce((total, item) => total + item.weeks.length, 0);
            return (
              <section
                className="overflow-hidden rounded-3xl border border-border bg-card"
                key={mesocycle.key}
              >
                <div className="flex flex-col gap-4 border-b border-border bg-muted/40 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <span className="font-mono text-3xl font-black text-muted-foreground/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      <Field
                        label="Mesociclo"
                        htmlFor={`mesocycle-${mesocycle.key}-name`}
                      >
                        <input
                          className={inputClass}
                          id={`mesocycle-${mesocycle.key}-name`}
                          maxLength={100}
                          onChange={(event) =>
                            updateMesocycle(mesocycle.key, (item) => ({
                              ...item,
                              name: event.target.value,
                            }))
                          }
                          required
                          value={mesocycle.name}
                        />
                      </Field>
                      <Field
                        label="Enfoque"
                        htmlFor={`mesocycle-${mesocycle.key}-focus`}
                      >
                        <select
                          className={inputClass}
                          id={`mesocycle-${mesocycle.key}-focus`}
                          onChange={(event) =>
                            updateMesocycle(mesocycle.key, (item) => ({
                              ...item,
                              focus: event.target.value as MesocycleFocus,
                            }))
                          }
                          value={mesocycle.focus}
                        >
                          {Object.entries(mesocycleFocusLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
                      <LevelField
                        label="Volumen"
                        value={mesocycle.volumeLevel}
                        onChange={(value) =>
                          updateMesocycle(mesocycle.key, (item) => ({
                            ...item,
                            volumeLevel: value,
                          }))
                        }
                      />
                      <LevelField
                        label="Intensidad"
                        value={mesocycle.intensityLevel}
                        onChange={(value) =>
                          updateMesocycle(mesocycle.key, (item) => ({
                            ...item,
                            intensityLevel: value,
                          }))
                        }
                      />
                      <Field
                        label="Objetivo del bloque"
                        htmlFor={`mesocycle-${mesocycle.key}-objective`}
                      >
                        <input
                          className={inputClass}
                          id={`mesocycle-${mesocycle.key}-objective`}
                          maxLength={1000}
                          onChange={(event) =>
                            updateMesocycle(mesocycle.key, (item) => ({
                              ...item,
                              objective: event.target.value,
                            }))
                          }
                          placeholder="Adaptación buscada"
                          value={mesocycle.objective}
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      label="Mover bloque arriba"
                      disabled={index === 0}
                      onClick={() => moveMesocycle(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton
                      label="Mover bloque abajo"
                      disabled={index === mesocycles.length - 1}
                      onClick={() => moveMesocycle(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton
                      label="Eliminar bloque"
                      disabled={mesocycles.length === 1}
                      onClick={() =>
                        setMesocycles((current) =>
                          current.filter((item) => item.key !== mesocycle.key),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="p-5 lg:p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-black text-foreground">
                        Microciclos semanales
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Semanas {priorWeeks + 1}–
                        {priorWeeks + mesocycle.weeks.length}
                      </p>
                    </div>
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-black text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      disabled={
                        mesocycle.weeks.length >= 12 || totalWeeks >= 52
                      }
                      onClick={() =>
                        updateMesocycle(mesocycle.key, (item) => ({
                          ...item,
                          weeks: [
                            ...item.weeks,
                            newWeek(item.weeks.length + 1),
                          ],
                        }))
                      }
                      type="button"
                    >
                      <Plus className="size-4" /> Semana
                    </button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {mesocycle.weeks.map((week, weekIndex) => (
                      <div
                        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[auto_1fr_140px_auto] sm:items-end"
                        key={week.key}
                      >
                        <div className="self-center">
                          <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Semana
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {priorWeeks + weekIndex + 1}
                          </p>
                        </div>
                        <Field
                          label="Objetivo semanal"
                          htmlFor={`week-${week.key}-objective`}
                        >
                          <input
                            className={inputClass}
                            id={`week-${week.key}-objective`}
                            maxLength={500}
                            onChange={(event) =>
                              updateMesocycle(mesocycle.key, (item) => ({
                                ...item,
                                weeks: item.weeks.map((value) =>
                                  value.key === week.key
                                    ? {
                                        ...value,
                                        objective: event.target.value,
                                      }
                                    : value,
                                ),
                              }))
                            }
                            value={week.objective}
                          />
                        </Field>
                        <Field label="Tipo" htmlFor={`week-${week.key}-load`}>
                          <select
                            className={inputClass}
                            id={`week-${week.key}-load`}
                            onChange={(event) =>
                              updateMesocycle(mesocycle.key, (item) => ({
                                ...item,
                                weeks: item.weeks.map((value) =>
                                  value.key === week.key
                                    ? {
                                        ...value,
                                        loadType: event.target
                                          .value as MicrocycleLoad,
                                      }
                                    : value,
                                ),
                              }))
                            }
                            value={week.loadType}
                          >
                            {Object.entries(microcycleLoadLabels).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </Field>
                        <IconButton
                          label="Eliminar semana"
                          disabled={mesocycle.weeks.length === 1}
                          onClick={() =>
                            updateMesocycle(mesocycle.key, (item) => ({
                              ...item,
                              weeks: item.weeks.filter(
                                (value) => value.key !== week.key,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                        <div className="sm:col-start-2 sm:col-span-2 grid grid-cols-2 gap-3">
                          <LevelField
                            compact
                            label="Volumen"
                            value={week.volumeLevel}
                            onChange={(value) =>
                              updateMesocycle(mesocycle.key, (item) => ({
                                ...item,
                                weeks: item.weeks.map((current) =>
                                  current.key === week.key
                                    ? { ...current, volumeLevel: value }
                                    : current,
                                ),
                              }))
                            }
                          />
                          <LevelField
                            compact
                            label="Intensidad"
                            value={week.intensityLevel}
                            onChange={(value) =>
                              updateMesocycle(mesocycle.key, (item) => ({
                                ...item,
                                weeks: item.weeks.map((current) =>
                                  current.key === week.key
                                    ? { ...current, intensityLevel: value }
                                    : current,
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={mesocycles.length >= 24 || totalWeeks >= 52}
            onClick={() =>
              setMesocycles((current) => [
                ...current,
                newMesocycle(current.length + 1),
              ])
            }
            type="button"
          >
            <Plus className="size-4" /> Agregar mesociclo
          </button>
          <button
            className="min-h-12 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
            disabled={isPending || totalWeeks > 52}
            type="submit"
          >
            {isPending ? "Guardando…" : "Guardar planificación"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <label
      className="relative block min-w-0 text-xs font-black text-muted-foreground"
      htmlFor={htmlFor}
    >
      {label}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function LevelField({
  compact = false,
  label,
  onChange,
  value,
}: {
  compact?: boolean;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block text-xs font-black text-muted-foreground">
      {label}
      <span className="mt-1.5 flex items-center gap-2">
        <input
          aria-label={`${label}: ${value} de 5`}
          className="h-11 min-w-0 flex-1 accent-[var(--primary)]"
          max={5}
          min={1}
          onChange={(event) => onChange(Number(event.target.value))}
          type="range"
          value={value}
        />
        <span
          className={`${compact ? "w-5" : "w-6"} text-center font-mono text-sm font-black text-foreground`}
        >
          {value}
        </span>
      </span>
    </label>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

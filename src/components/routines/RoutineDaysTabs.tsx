"use client";

import {
  Children,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";

type RoutineDay = {
  dayNumber: number;
  exerciseCount: number;
};

export function RoutineDaysTabs({
  children,
  days,
}: {
  children: ReactNode;
  days: RoutineDay[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const instanceId = useId();
  const panels = Children.toArray(children);
  const activeDay = days[activeIndex];

  if (!activeDay) return null;

  const selectAndFocus = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % days.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + days.length) % days.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = days.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      selectAndFocus(nextIndex);
    }
  };

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
              Rutina semanal
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              Selecciona un día
            </h2>
          </div>
          <p className="shrink-0 text-xs font-bold text-slate-500">
            {activeDay.exerciseCount} ejercicio
            {activeDay.exerciseCount === 1 ? "" : "s"}
          </p>
        </div>

        <div
          aria-label="Días de la rutina"
          className="flex gap-2 overflow-x-auto p-3 sm:p-4"
          role="tablist"
        >
          {days.map((day, index) => {
            const isActive = index === activeIndex;
            const tabId = `${instanceId}-tab-${day.dayNumber}`;
            const panelId = `${instanceId}-panel-${day.dayNumber}`;
            return (
              <button
                aria-controls={panelId}
                aria-selected={isActive}
                className={`min-w-28 shrink-0 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300 hover:bg-orange-50"
                }`}
                id={tabId}
                key={day.dayNumber}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <span className="block text-sm font-black">
                  Día {day.dayNumber}
                </span>
                <span
                  className={`mt-0.5 block text-[10px] font-bold ${
                    isActive ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {day.exerciseCount} ejercicio
                  {day.exerciseCount === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-labelledby={`${instanceId}-tab-${activeDay.dayNumber}`}
        className="mt-5"
        id={`${instanceId}-panel-${activeDay.dayNumber}`}
        role="tabpanel"
      >
        {panels[activeIndex]}
      </div>
    </section>
  );
}

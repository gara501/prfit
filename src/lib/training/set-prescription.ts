export type EffortMetric = "rir" | "rpe";

export const setTypes = [
  "warmup",
  "ramp_up",
  "working",
  "drop_set",
  "amrap",
] as const;

export type SetType = (typeof setTypes)[number];

export function effortBounds(metric: EffortMetric) {
  return metric === "rir" ? { min: 0, max: 10 } : { min: 1, max: 10 };
}

export function isValidEffort(metric: EffortMetric, value: number | null) {
  if (value === null) return true;
  const { min, max } = effortBounds(metric);
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isValidRepRange(min: number | null, max: number | null) {
  return (
    min !== null &&
    max !== null &&
    Number.isInteger(min) &&
    Number.isInteger(max) &&
    min > 0 &&
    min <= max
  );
}

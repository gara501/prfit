export const TRAINING_SCALES = {
  rir: { min: 0, max: 10 },
  rpe: { min: 1, max: 10 },
  energy: { min: 1, max: 5 },
  discomfort: { min: 0, max: 10 },
} as const;

export type TrainingScale = keyof typeof TRAINING_SCALES;
export type WeightUnit = "kg" | "lb";

const KILOGRAMS_PER_POUND = 0.45359237;

export function isValidScaleValue(
  scale: TrainingScale,
  value: number,
): boolean {
  const { min, max } = TRAINING_SCALES[scale];
  return Number.isFinite(value) && value >= min && value <= max;
}

export function normalizeWeightToKilograms(
  value: number,
  unit: WeightUnit,
): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      "El peso debe ser un número finito mayor o igual a cero.",
    );
  }

  const kilograms = unit === "lb" ? value * KILOGRAMS_PER_POUND : value;
  return Math.round(kilograms * 1000) / 1000;
}

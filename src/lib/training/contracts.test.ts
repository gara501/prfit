import { describe, expect, it } from "vitest";
import { isValidScaleValue, normalizeWeightToKilograms } from "./contracts";

describe("training data contracts", () => {
  it("accepts the boundaries of each subjective scale", () => {
    expect(isValidScaleValue("rir", 0)).toBe(true);
    expect(isValidScaleValue("rir", 10)).toBe(true);
    expect(isValidScaleValue("rpe", 1)).toBe(true);
    expect(isValidScaleValue("rpe", 10)).toBe(true);
    expect(isValidScaleValue("energy", 1)).toBe(true);
    expect(isValidScaleValue("energy", 5)).toBe(true);
    expect(isValidScaleValue("discomfort", 0)).toBe(true);
    expect(isValidScaleValue("discomfort", 10)).toBe(true);
  });

  it("rejects values outside a scale and non-finite values", () => {
    expect(isValidScaleValue("rir", -1)).toBe(false);
    expect(isValidScaleValue("rpe", 0)).toBe(false);
    expect(isValidScaleValue("energy", 6)).toBe(false);
    expect(isValidScaleValue("discomfort", Number.NaN)).toBe(false);
  });

  it("keeps kilograms and converts pounds to canonical kilograms", () => {
    expect(normalizeWeightToKilograms(72.5, "kg")).toBe(72.5);
    expect(normalizeWeightToKilograms(100, "lb")).toBe(45.359);
  });

  it("rejects invalid weights", () => {
    expect(() => normalizeWeightToKilograms(-1, "kg")).toThrow(RangeError);
    expect(() =>
      normalizeWeightToKilograms(Number.POSITIVE_INFINITY, "kg"),
    ).toThrow(RangeError);
  });
});

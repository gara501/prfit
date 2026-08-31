import { describe, expect, it } from "vitest";
import {
  effortBounds,
  isValidEffort,
  isValidRepRange,
  setTypes,
} from "./set-prescription";

describe("set prescription contract", () => {
  it("keeps RIR and RPE in their distinct valid ranges", () => {
    expect(effortBounds("rir")).toEqual({ min: 0, max: 10 });
    expect(effortBounds("rpe")).toEqual({ min: 1, max: 10 });
    expect(isValidEffort("rir", 0)).toBe(true);
    expect(isValidEffort("rpe", 0)).toBe(false);
    expect(isValidEffort("rpe", 10)).toBe(true);
    expect(isValidEffort("rir", 11)).toBe(false);
  });

  it("requires an ordered positive repetition range", () => {
    expect(isValidRepRange(8, 12)).toBe(true);
    expect(isValidRepRange(12, 8)).toBe(false);
    expect(isValidRepRange(0, 8)).toBe(false);
    expect(isValidRepRange(null, null)).toBe(false);
  });

  it("exposes only the initial planned set types", () => {
    expect(setTypes).toEqual([
      "warmup",
      "ramp_up",
      "working",
      "drop_set",
      "amrap",
    ]);
  });
});

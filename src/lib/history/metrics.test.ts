import { describe, expect, it } from "vitest";
import {
  estimateOneRepMax,
  getEstimatedOneRepMaxTrend,
  getLatestSessionComparison,
} from "./metrics";

describe("estimateOneRepMax", () => {
  it("uses the visible Epley formula", () => {
    expect(estimateOneRepMax(100, 5)).toBe(116.67);
  });

  it("does not estimate a set without usable performance data", () => {
    expect(estimateOneRepMax(80, null)).toBeNull();
    expect(estimateOneRepMax(null, 8)).toBeNull();
  });
});

describe("getEstimatedOneRepMaxTrend", () => {
  it("keeps the best work set per session and omits warmups", () => {
    expect(
      getEstimatedOneRepMaxTrend([
        {
          id: "newest",
          performedAt: "2026-08-30",
          sets: [
            {
              id: "warmup",
              setNumber: 1,
              reps: 8,
              weight: 50,
              actualRir: null,
              actualRpe: null,
              setType: "warmup",
              isWarmup: true,
              volume: 0,
              estimated1Rm: 63.33,
            },
            {
              id: "work",
              setNumber: 2,
              reps: 5,
              weight: 100,
              actualRir: null,
              actualRpe: null,
              setType: "normal",
              isWarmup: false,
              volume: 500,
              estimated1Rm: 116.67,
            },
          ],
        },
        {
          id: "older",
          performedAt: "2026-08-20",
          sets: [],
        },
      ]),
    ).toEqual([{ date: "2026-08-30", value: 116.67 }]);
  });
});

describe("getLatestSessionComparison", () => {
  it("compares the latest work against the previous session", () => {
    expect(
      getLatestSessionComparison([
        {
          id: "latest",
          performedAt: "2026-08-30",
          sets: [
            {
              id: "set-1",
              setNumber: 1,
              reps: 5,
              weight: 100,
              actualRir: null,
              actualRpe: null,
              setType: "normal",
              isWarmup: false,
              volume: 500,
              estimated1Rm: 116.67,
            },
          ],
        },
        {
          id: "previous",
          performedAt: "2026-08-23",
          sets: [
            {
              id: "set-2",
              setNumber: 1,
              reps: 5,
              weight: 95,
              actualRir: null,
              actualRpe: null,
              setType: "normal",
              isWarmup: false,
              volume: 475,
              estimated1Rm: 110.83,
            },
          ],
        },
      ]),
    ).toMatchObject({ volumeDelta: 25, estimated1RmDelta: 5.84 });
  });
});

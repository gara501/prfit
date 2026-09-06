import { describe, expect, it } from "vitest";
import { renderProgressPdf, renderRoutinePdf } from "./documents";

describe("report documents", () => {
  it("renders a routine as a PDF buffer", async () => {
    const result = await renderRoutinePdf({
      id: "routine",
      clientId: "client",
      clientName: "Cliente Prueba",
      trainerName: "Trainer Prueba",
      name: "Fuerza base",
      description: "Bloque inicial",
      goal: "Mejorar fuerza general",
      versionNumber: 2,
      status: "published",
      startDate: "2026-09-01",
      endDate: "2026-10-01",
      daysAtWeek: 1,
      intensityLevel: 3,
      effortMetric: "rir",
      exercises: [
        {
          dayNumber: 1,
          orderIndex: 0,
          name: "Sentadilla",
          techniqueNotes: "Controlar la bajada.",
          clientNotes: "",
          sets: [
            {
              setNumber: 1,
              reps: 8,
              repsMin: null,
              repsMax: null,
              weight: 50,
              restSeconds: 120,
              targetRir: 2,
              targetRpe: null,
              tempo: "3-1-1-0",
              setType: "working",
              trainingMethod: "straight",
              optional: false,
            },
          ],
        },
      ],
    });
    expect(result.subarray(0, 4).toString()).toBe("%PDF");
    expect(result.byteLength).toBeGreaterThan(1_000);
  });

  it("renders an anonymized progress report", async () => {
    const result = await renderProgressPdf({
      clientId: "client",
      clientName: "Cliente CardonaFit",
      trainerName: "",
      from: "2026-01-01",
      to: "2026-09-01",
      anonymized: true,
      authorizationConfirmed: false,
      trainerNotes: "",
      plannedSessions: 10,
      completedSessions: 8,
      adherencePercent: 80,
      completedSets: 40,
      totalReps: 320,
      volumeKg: 12500,
      totalDurationSeconds: 28_800,
      exercises: [],
      weightProgress: [],
      fatProgress: [],
      healthStatus: "not_submitted",
    });
    expect(result.subarray(0, 4).toString()).toBe("%PDF");
  });
});

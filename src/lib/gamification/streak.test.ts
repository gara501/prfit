import { describe, expect, it } from "vitest";
import {
  calculateGamificationSummary,
  getCalendarDateInTimeZone,
  type ScheduledWorkoutForStreak,
} from "./streak";

const workout = (
  scheduledDate: string,
  status: ScheduledWorkoutForStreak["status"],
): ScheduledWorkoutForStreak => ({ scheduledDate, status });

describe("client adherence streak", () => {
  it("counts consecutive scheduled training days and ignores rest days", () => {
    const summary = calculateGamificationSummary(
      [
        workout("2026-08-31", "completed"),
        workout("2026-09-02", "completed"),
        workout("2026-09-05", "completed"),
      ],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(3);
    expect(summary.bestStreak).toBe(3);
    expect(summary.currentLevel?.id).toBe("impulso");
  });

  it("breaks the streak on a skipped or overdue training day", () => {
    const summary = calculateGamificationSummary(
      [
        workout("2026-09-01", "completed"),
        workout("2026-09-02", "skipped"),
        workout("2026-09-03", "completed"),
        workout("2026-09-04", "scheduled"),
      ],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(0);
    expect(summary.bestStreak).toBe(1);
  });

  it("keeps today's pending session from breaking the active streak", () => {
    const summary = calculateGamificationSummary(
      [
        workout("2026-09-01", "completed"),
        workout("2026-09-03", "completed"),
        workout("2026-09-05", "scheduled"),
      ],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(2);
    expect(summary.pendingToday).toBe(true);
  });

  it("requires every workout on the same date to be completed", () => {
    const summary = calculateGamificationSummary(
      [
        workout("2026-09-03", "completed"),
        workout("2026-09-03", "scheduled"),
        workout("2026-09-04", "completed"),
      ],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(1);
    expect(summary.completedTrainingDays).toBe(1);
  });

  it("ignores cancelled and future workouts", () => {
    const summary = calculateGamificationSummary(
      [
        workout("2026-09-01", "completed"),
        workout("2026-09-02", "cancelled"),
        workout("2026-09-10", "scheduled"),
      ],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(1);
    expect(summary.scheduledTrainingDays).toBe(1);
    expect(summary.hasSchedule).toBe(true);
  });

  it("retains the medal earned by the best historical streak", () => {
    const completed = Array.from({ length: 7 }, (_, index) =>
      workout(`2026-08-${String(index + 10).padStart(2, "0")}`, "completed"),
    );
    const summary = calculateGamificationSummary(
      [...completed, workout("2026-08-20", "skipped")],
      "2026-09-05",
    );

    expect(summary.currentStreak).toBe(0);
    expect(summary.bestStreak).toBe(7);
    expect(summary.currentLevel?.id).toBe("constancia");
    expect(summary.nextLevel?.id).toBe("disciplina");
  });

  it("uses the configured timezone at the UTC date boundary", () => {
    expect(
      getCalendarDateInTimeZone(
        new Date("2026-09-06T02:30:00.000Z"),
        "America/Bogota",
      ),
    ).toBe("2026-09-05");
  });
});

import { describe, expect, it } from "vitest";
import {
  canCompleteSession,
  isSessionEditable,
  sessionStatuses,
} from "./session-lifecycle";

describe("session lifecycle contract", () => {
  it("only allows completion when every planned set is complete", () => {
    expect(canCompleteSession("in_progress", 3, 3)).toBe(true);
    expect(canCompleteSession("in_progress", 2, 3)).toBe(false);
    expect(canCompleteSession("in_progress", 0, 0)).toBe(false);
  });

  it("keeps completed and abandoned sessions read-only", () => {
    expect(isSessionEditable("in_progress")).toBe(true);
    expect(isSessionEditable("completed")).toBe(false);
    expect(isSessionEditable("abandoned")).toBe(false);
  });

  it("exposes the three explicit lifecycle statuses", () => {
    expect(sessionStatuses).toEqual(["in_progress", "completed", "abandoned"]);
  });
});

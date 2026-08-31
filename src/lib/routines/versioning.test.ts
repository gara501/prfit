import { describe, expect, it } from "vitest";
import {
  canArchiveRoutineVersion,
  canCloneRoutineVersion,
  canEditRoutineVersion,
  canPublishRoutineVersion,
  routineVersionLabels,
} from "./versioning";

describe("routine versioning rules", () => {
  it("only lets drafts be edited and published", () => {
    expect(canEditRoutineVersion("draft")).toBe(true);
    expect(canPublishRoutineVersion("draft")).toBe(true);
    expect(canEditRoutineVersion("published")).toBe(false);
    expect(canPublishRoutineVersion("archived")).toBe(false);
  });

  it("only lets published versions be archived", () => {
    expect(canArchiveRoutineVersion("published")).toBe(true);
    expect(canArchiveRoutineVersion("draft")).toBe(false);
    expect(canArchiveRoutineVersion("archived")).toBe(false);
  });

  it("creates new versions from published or archived plans", () => {
    expect(canCloneRoutineVersion("draft")).toBe(false);
    expect(canCloneRoutineVersion("published")).toBe(true);
    expect(canCloneRoutineVersion("archived")).toBe(true);
  });

  it("uses concise Spanish status labels", () => {
    expect(routineVersionLabels).toEqual({
      draft: "Borrador",
      published: "Publicado",
      archived: "Archivado",
    });
  });
});

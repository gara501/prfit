import { describe, expect, it } from "vitest";
import { buildExercisesHref, parseExercisePage } from "./pagination";

describe("exercise catalog pagination", () => {
  it("normalizes invalid pages", () => {
    expect(parseExercisePage()).toBe(1);
    expect(parseExercisePage("0")).toBe(1);
    expect(parseExercisePage("2.5")).toBe(1);
    expect(parseExercisePage("3")).toBe(3);
  });

  it("preserves the search while changing pages", () => {
    expect(buildExercisesHref(1, " press ")).toBe("/trainer/exercises?q=press");
    expect(buildExercisesHref(3, "press")).toBe(
      "/trainer/exercises?q=press&page=3",
    );
  });
});

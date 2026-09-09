import { describe, expect, it } from "vitest";
import { getPasswordRedirectPath } from "./redirect-path";

describe("password redirects", () => {
  it("allows the password flows only", () => {
    expect(getPasswordRedirectPath("/auth/reset-password")).toBe(
      "/auth/reset-password",
    );
    for (const path of [
      null,
      "//evil.test",
      "/\\evil.test",
      "/%5cevil.test",
      "https://evil.test",
      "/auth/reset-password?next=//evil.test",
    ]) {
      expect(getPasswordRedirectPath(path)).toBe("/auth/setup-password");
    }
  });
});

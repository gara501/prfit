import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("PRFit web manifest", () => {
  it("declares an installable standalone experience with required icons", () => {
    const result = manifest();

    expect(result.name).toBe("PRFit");
    expect(result.short_name).toBe("PRFit");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sizes: "192x192",
          type: "image/png",
        }),
        expect.objectContaining({
          purpose: "maskable",
          sizes: "512x512",
          type: "image/png",
        }),
      ]),
    );
  });
});

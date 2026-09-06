import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapes commas, quotes and line breaks", () => {
    expect(toCsv([{ name: 'Ana, "A"', note: "línea 1\nlínea 2" }])).toBe(
      'name,note\r\n"Ana, ""A""","línea 1\nlínea 2"',
    );
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(toCsv([{ value: '=HYPERLINK("bad")' }])).toContain(
      '"\'=HYPERLINK(""bad"")"',
    );
  });
});

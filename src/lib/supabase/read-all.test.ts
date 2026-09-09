import { expect, it } from "vitest";
import { readAll } from "./read-all";

it("continues past a server row cap smaller than the page size", async () => {
  const rows = [1, 2, 3, 4, 5];
  const result = await readAll({
    range: async (from) => ({ data: rows.slice(from, from + 2), error: null }),
  });
  expect(result.data).toEqual(rows);
});
it("rejects an incomplete export after a later page fails", async () => {
  await expect(
    readAll({
      range: async (from) =>
        from === 0
          ? { data: [1], error: null }
          : { data: null, error: { message: "unavailable" } },
    }),
  ).rejects.toThrow();
});

import { expect, it } from "vitest";
import { createSaveQueue } from "./save-queue";

it("serializes a set's saves while allowing another set to save", async () => {
  const enqueue = createSaveQueue();
  const order: string[] = [];
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = enqueue("a", async () => {
    await gate;
    order.push("first");
  });
  const second = enqueue("a", async () => {
    order.push("second");
  });
  await enqueue("b", async () => {
    order.push("other");
  });
  expect(order).toEqual(["other"]);
  release();
  await Promise.all([first, second]);
  expect(order).toEqual(["other", "first", "second"]);
});
it("does not block later edits after a failed save", async () => {
  const enqueue = createSaveQueue();
  await expect(
    enqueue("a", async () => {
      throw new Error("offline");
    }),
  ).rejects.toThrow();
  await expect(enqueue("a", async () => 42)).resolves.toBe(42);
});

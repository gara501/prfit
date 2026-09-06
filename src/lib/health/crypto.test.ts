import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptHealthValue,
  encryptHealthValue,
  hashHealthContent,
} from "./crypto-core";

const originalKey = process.env.MEDICAL_DATA_ENCRYPTION_KEY;

describe("health data encryption", () => {
  beforeEach(() => {
    process.env.MEDICAL_DATA_ENCRYPTION_KEY =
      "test-key-that-is-never-used-in-production";
  });

  afterEach(() => {
    if (originalKey === undefined)
      delete process.env.MEDICAL_DATA_ENCRYPTION_KEY;
    else process.env.MEDICAL_DATA_ENCRYPTION_KEY = originalKey;
  });

  it("round-trips structured health data without storing plaintext", () => {
    const value = { condition: "asma", medication: "ninguna" };
    const encrypted = encryptHealthValue(value);

    expect(encrypted.ciphertext).not.toContain("asma");
    expect(decryptHealthValue(encrypted)).toEqual(value);
  });

  it("uses a random IV and rejects an altered authentication tag", () => {
    const first = encryptHealthValue({ answer: "yes" });
    const second = encryptHealthValue({ answer: "yes" });

    expect(first.iv).not.toBe(second.iv);
    expect(() => decryptHealthValue({ ...first, tag: second.tag })).toThrow();
  });

  it("creates a stable content hash for the signed payload", () => {
    expect(hashHealthContent({ answer: "no" })).toBe(
      hashHealthContent({ answer: "no" }),
    );
  });
});

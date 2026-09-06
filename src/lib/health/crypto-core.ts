import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type EncryptedValue = { ciphertext: string; iv: string; tag: string };

function getEncryptionKey() {
  const source =
    process.env.MEDICAL_DATA_ENCRYPTION_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!source) {
    throw new Error(
      "Falta MEDICAL_DATA_ENCRYPTION_KEY en el entorno del servidor.",
    );
  }
  return createHash("sha256").update(source, "utf8").digest();
}

export function encryptHealthValue(value: unknown): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptHealthValue<T>(encrypted: EncryptedValue): T {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

export function hashHealthContent(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

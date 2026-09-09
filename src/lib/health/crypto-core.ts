import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion?: number;
};

function currentKeyVersion() {
  const version = Number(process.env.MEDICAL_DATA_ENCRYPTION_KEY_VERSION ?? 1);
  if (!Number.isInteger(version) || version < 1 || version > 32767)
    throw new Error("Versión de cifrado médico inválida.");
  return version;
}

function getEncryptionKey(version: number) {
  const source =
    process.env[`MEDICAL_DATA_ENCRYPTION_KEY_V${version}`] ??
    (version === 1 ? process.env.MEDICAL_DATA_ENCRYPTION_KEY : undefined);
  if (!source || source.length < 32)
    throw new Error(
      `Falta una clave médica válida para la versión ${version}.`,
    );
  return createHash("sha256").update(source, "utf8").digest();
}

export function encryptHealthValue(value: unknown): EncryptedValue {
  const keyVersion = currentKeyVersion();
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(keyVersion),
    iv,
  );
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    keyVersion,
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptHealthValue<T>(encrypted: EncryptedValue): T {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(encrypted.keyVersion ?? 1),
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

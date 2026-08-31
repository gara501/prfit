import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const projectId = process.env.SUPABASE_PROJECT_ID;
const isLinked =
  existsSync(resolve("supabase/config.toml")) ||
  existsSync(resolve("supabase/.temp/project-ref"));

if (!projectId && !isLinked) {
  throw new Error(
    "Vincula el proyecto con `npm exec -- supabase link` o define SUPABASE_PROJECT_ID.",
  );
}

if (projectId && !process.env.SUPABASE_ACCESS_TOKEN) {
  throw new Error(
    "Define SUPABASE_ACCESS_TOKEN para generar tipos con SUPABASE_PROJECT_ID.",
  );
}

const executable = resolve(
  "node_modules/.bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);
const args = ["gen", "types", "typescript", "--schema", "public"];

if (projectId) {
  args.push("--project-id", projectId);
} else {
  args.push("--linked");
}

const result = spawnSync(executable, args, {
  encoding: "utf8",
  env: process.env,
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  const details = [result.error?.message, result.stderr, result.stdout]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n")
    .trim();

  throw new Error(details || "Supabase no pudo generar los tipos.");
}

if (
  !result.stdout.includes("export type Json") ||
  !result.stdout.includes("export type Database")
) {
  throw new Error("Supabase devolvió una definición de tipos inesperada.");
}

const typesDirectory = resolve("src/types");
const destination = resolve(typesDirectory, "database.ts");
const temporaryDestination = resolve(typesDirectory, "database.ts.tmp");

mkdirSync(typesDirectory, { recursive: true });
try {
  writeFileSync(temporaryDestination, result.stdout, "utf8");
  renameSync(temporaryDestination, destination);
} finally {
  rmSync(temporaryDestination, { force: true });
}

console.log("Tipos de Supabase actualizados en src/types/database.ts.");

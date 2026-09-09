// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const client = "00000000-0000-4000-8000-000000000001";
const trainer = "00000000-0000-4000-8000-000000000002";
async function asUser(id: string, sql: string) {
  await db.exec("begin; set local role authenticated;");
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
    return await db.exec(sql);
  } finally {
    await db.exec("rollback");
  }
}
beforeAll(async () => {
  await db.exec(await readFile("src/test/fixtures/audit-schema.sql", "utf8"));
  await db.exec(
    await readFile(
      "supabase/migrations/20260909003855_audit_security_integrity_performance.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("database security regressions", () => {
  it("allows profile fields but rejects role and onboarding changes", async () => {
    await expect(
      asUser(
        client,
        `update profiles set first_name='New' where id='${client}'`,
      ),
    ).resolves.toBeDefined();
    for (const field of [
      "role='admin'",
      "is_active=false",
      "must_change_password=false",
      "email='other@example.test'",
    ]) {
      await expect(
        asUser(client, `update profiles set ${field} where id='${client}'`),
      ).rejects.toThrow(/permission denied/);
    }
  });
  it("rejects browser writes to medical ciphertext and privileged RPCs", async () => {
    for (const table of [
      "health_screenings",
      "health_screening_reviews",
      "health_documents",
    ]) {
      await expect(
        asUser(client, `insert into ${table}(id) values(gen_random_uuid())`),
      ).rejects.toThrow(/permission denied/);
    }
    await expect(
      asUser(
        client,
        `select submit_encrypted_health_screening('${client}',false,'{}','hash')`,
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("rejects a foreign storage path even for a privileged insert", async () => {
    await expect(
      db.exec(
        `insert into health_documents(client_id,storage_path,screening_id) values('${client}','other/secret.pdf',gen_random_uuid())`,
      ),
    ).rejects.toThrow();
  });
  it("rolls back the exercise when a relationship is invalid", async () => {
    await expect(
      asUser(
        trainer,
        `select save_exercise_catalog(null,'Squat',null,null,array[gen_random_uuid()],array[]::uuid[])`,
      ),
    ).rejects.toThrow(/foreign key/);
    const result = await db.query<{ count: number }>(
      "select count(*)::int as count from exercises",
    );
    expect(result.rows[0].count).toBe(0);
  });
  it("saves deduplicated relationships atomically for trainers", async () => {
    await expect(
      asUser(
        trainer,
        "select save_exercise_catalog(null,'Squat',null,null,array[]::uuid[],array[]::uuid[])",
      ),
    ).resolves.toBeDefined();
    await expect(
      asUser(
        client,
        "select save_exercise_catalog(null,'Squat',null,null,array[]::uuid[],array[]::uuid[])",
      ),
    ).rejects.toThrow(/autorizado/);
  });
  it("validates the actor on trusted medical submissions", async () => {
    await expect(
      db.exec(
        `select submit_encrypted_health_screening('${trainer}',false,'{}','hash')`,
      ),
    ).rejects.toThrow(/autorizado/);
    await expect(
      db.exec(
        `select record_encrypted_health_review('${trainer}','00000000-0000-4000-8000-000000000003',gen_random_uuid(),'cleared',null)`,
      ),
    ).rejects.toThrow(/asignado/);
  });
});

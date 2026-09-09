import { isOwnMedicalDocumentPath } from "@/lib/health/document-path";
import { readAll, readByIds, requireQuery } from "@/lib/supabase/read-all";
import "server-only";

import { PassThrough, Readable } from "node:stream";
import { ZipArchive } from "archiver";
import {
  calculateGamificationSummary,
  getCalendarDateInTimeZone,
} from "@/lib/gamification/streak";
import { decryptHealthValue } from "@/lib/health/crypto";
import type { HealthScreeningPayload } from "@/lib/health/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeFilename } from "./auth";
import { toCsv } from "./csv";

const MAX_ARCHIVE_SOURCE_BYTES = 100 * 1024 * 1024;

type ArchiveEntry =
  | { name: string; content: Buffer | string }
  | { name: string; load: () => AsyncGenerator<Buffer> };

export async function prepareClientArchive(clientId: string) {
  const admin = createAdminClient();
  const [
    profileResult,
    assignmentsResult,
    routinesResult,
    sessionsResult,
    feedbackResult,
    measurementsResult,
    progressionRulesResult,
    progressionSuggestionsResult,
    scheduleResult,
    screeningsResult,
    documentsResult,
    messagesResult,
  ] = await Promise.all([
    requireQuery(
      admin.from("profiles").select("*").eq("id", clientId).maybeSingle(),
    ),
    readAll(
      admin
        .from("trainer_clients")
        .select("*")
        .eq("client_id", clientId)
        .order("start_date")
        .order("id"),
    ),
    readAll(
      admin
        .from("routines")
        .select("*")
        .eq("client_id", clientId)
        .order("start_date")
        .order("id"),
    ),
    readAll(
      admin
        .from("workout_sessions")
        .select("*")
        .eq("client_id", clientId)
        .order("started_at")
        .order("id"),
    ),
    readAll(
      admin
        .from("workout_session_feedback")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at")
        .order("session_id"),
    ),
    readAll(
      admin
        .from("body_compositions")
        .select("*")
        .eq("client_id", clientId)
        .order("date")
        .order("id"),
    ),
    readAll(
      admin
        .from("routine_exercise_progression_rules")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at")
        .order("id"),
    ),
    readAll(
      admin
        .from("routine_progression_suggestions")
        .select("*")
        .eq("client_id", clientId)
        .order("generated_at")
        .order("id"),
    ),
    readAll(
      admin
        .from("scheduled_workouts")
        .select("*")
        .eq("client_id", clientId)
        .order("scheduled_date")
        .order("id"),
    ),
    readAll(
      admin
        .from("health_screenings")
        .select("*")
        .eq("client_id", clientId)
        .order("submitted_at")
        .order("id"),
    ),
    readAll(
      admin
        .from("health_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at")
        .order("id"),
    ),
    readAll(
      admin
        .from("trainer_client_messages")
        .select("*")
        .eq("client_id", clientId)
        .order("sent_at")
        .order("id"),
    ),
  ]);
  const profile = profileResult.data;
  if (!profile || profile.role !== "client") return null;
  const routines = routinesResult.data ?? [];
  const routineIds = routines.map((routine) => routine.id);
  const sessions = sessionsResult.data ?? [];
  const sessionIds = sessions.map((session) => session.id);
  const [{ data: routineExercises }, { data: sessionSets }] = await Promise.all(
    [
      routineIds.length
        ? readByIds(routineIds, (batch) =>
            admin
              .from("routine_exercises")
              .select("*")
              .in("routine_id", batch)
              .order("day_number")
              .order("order_index")
              .order("id"),
          )
        : Promise.resolve({ data: [] }),
      sessionIds.length
        ? readByIds(sessionIds, (batch) =>
            admin
              .from("workout_session_sets")
              .select("*")
              .in("workout_session_id", batch)
              .order("set_number")
              .order("id"),
          )
        : Promise.resolve({ data: [] }),
    ],
  );
  const routineExerciseIds = (routineExercises ?? []).map(
    (exercise) => exercise.id,
  );
  const { data: routineSets } = routineExerciseIds.length
    ? await readByIds(routineExerciseIds, (batch) =>
        admin
          .from("routine_exercise_sets")
          .select("*")
          .in("routine_exercise_id", batch)
          .order("set_number")
          .order("id"),
      )
    : { data: [] };
  const exerciseIds = [
    ...new Set([
      ...(routineExercises ?? []).map((exercise) => exercise.exercise_id),
      ...(sessionSets ?? []).map(
        (set) => set.executed_exercise_id ?? set.exercise_id,
      ),
    ]),
  ];
  const { data: exercises } = exerciseIds.length
    ? await readByIds(exerciseIds, (batch) =>
        admin.from("exercises").select("id,name").in("id", batch).order("id"),
      )
    : { data: [] };
  const exerciseNames = new Map(
    (exercises ?? []).map((exercise) => [exercise.id, exercise.name]),
  );

  const health = await Promise.all(
    (screeningsResult.data ?? []).map(async (screening) => {
      const { data: reviews } = await readAll(
        admin
          .from("health_screening_reviews")
          .select("*")
          .eq("screening_id", screening.id)
          .order("reviewed_at")
          .order("id"),
      );
      return {
        id: screening.id,
        version: screening.version,
        submittedAt: screening.submitted_at,
        expiresAt: screening.expires_at,
        hasCriticalRisk: screening.has_critical_risk,
        questionnaireVersion: screening.questionnaire_version,
        consentVersion: screening.consent_version,
        privacyNoticeVersion: screening.privacy_notice_version,
        answers: decryptHealthValue<HealthScreeningPayload>({
          ciphertext: screening.payload_ciphertext,
          iv: screening.encryption_iv,
          tag: screening.encryption_tag,
          keyVersion: screening.encryption_key_version,
        }),
        reviews: (reviews ?? []).map((review) => ({
          id: review.id,
          decision: review.decision,
          reviewedAt: review.reviewed_at,
          trainerId: review.trainer_id,
          notes:
            review.notes_ciphertext &&
            review.encryption_iv &&
            review.encryption_tag
              ? decryptHealthValue<string>({
                  ciphertext: review.notes_ciphertext,
                  iv: review.encryption_iv,
                  tag: review.encryption_tag,
                  keyVersion: review.encryption_key_version ?? 1,
                })
              : "",
        })),
      };
    }),
  );

  const enrichedRoutines = routines.map((routine) => ({
    ...routine,
    exercises: (routineExercises ?? [])
      .filter((exercise) => exercise.routine_id === routine.id)
      .map((exercise) => ({
        ...exercise,
        exercise_name: exerciseNames.get(exercise.exercise_id) ?? null,
        sets: (routineSets ?? []).filter(
          (set) => set.routine_exercise_id === exercise.id,
        ),
      })),
  }));
  const enrichedSessionSets = (sessionSets ?? []).map((set) => ({
    ...set,
    exercise_name:
      exerciseNames.get(set.executed_exercise_id ?? set.exercise_id) ?? null,
  }));
  const schedule = scheduleResult.data ?? [];
  const today = getCalendarDateInTimeZone();
  const gamification = calculateGamificationSummary(
    schedule.map((item) => ({
      scheduledDate: item.scheduled_date,
      status: item.status as
        | "scheduled"
        | "completed"
        | "skipped"
        | "rescheduled"
        | "cancelled",
    })),
    today,
  );

  const entries: ArchiveEntry[] = [
    { name: "perfil.json", content: json(profile) },
    { name: "asignaciones.csv", content: toCsv(assignmentsResult.data ?? []) },
    { name: "rutinas.json", content: json(enrichedRoutines) },
    { name: "sesiones.csv", content: toCsv(sessions) },
    { name: "series_realizadas.csv", content: toCsv(enrichedSessionSets) },
    { name: "feedback.csv", content: toCsv(feedbackResult.data ?? []) },
    {
      name: "mensajes_trainer_cliente.csv",
      content: toCsv(messagesResult.data ?? []),
    },
    {
      name: "mediciones_corporales.csv",
      content: toCsv(measurementsResult.data ?? []),
    },
    {
      name: "progresiones.json",
      content: json({
        rules: progressionRulesResult.data ?? [],
        suggestions: progressionSuggestionsResult.data ?? [],
      }),
    },
    { name: "calendario.csv", content: toCsv(schedule) },
    { name: "logros.json", content: json(gamification) },
    { name: "evaluaciones_salud.json", content: json(health) },
  ];
  let approximateSizeBytes = entries.reduce(
    (total, entry) =>
      total + ("content" in entry ? Buffer.byteLength(entry.content) : 0),
    0,
  );
  const documents = documentsResult.data;
  for (const document of documents) {
    if (
      !isOwnMedicalDocumentPath(
        document.storage_path,
        clientId,
        document.screening_id,
      )
    )
      throw new Error("Un documento no pertenece a esta evaluación.");
    approximateSizeBytes += document.size_bytes;
  }
  if (approximateSizeBytes > MAX_ARCHIVE_SOURCE_BYTES)
    throw new Error("La exportación supera el límite de 100 MB.");
  const usedDocumentNames = new Set<string>();
  for (const document of documents) {
    const uniqueName = uniqueFilename(
      sanitizeFilename(document.original_name) || `${document.id}.bin`,
      usedDocumentNames,
    );
    usedDocumentNames.add(uniqueName);
    entries.push({
      name: `documentos_medicos/${uniqueName}`,
      load: async function* () {
        const { data, error } = await admin.storage
          .from("medical-documents")
          .download(document.storage_path);
        if (
          error ||
          !data ||
          data.size !== document.size_bytes ||
          data.size > 10 * 1024 * 1024
        )
          throw new Error(
            "No fue posible verificar un documento de la exportación.",
          );
        yield Buffer.from(await data.arrayBuffer());
      },
    });
  }
  const manifest = {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    subjectId: clientId,
    format: "CardonaFit client data export",
    files: ["manifest.json", ...entries.map((entry) => entry.name)],
    notes: [
      "Las fechas están expresadas en ISO 8601 o YYYY-MM-DD.",
      "Los CSV incluyen datos tabulares y los JSON conservan estructuras complejas.",
      "Este paquete se generó bajo solicitud y no se conserva como archivo público.",
    ],
  };
  if (
    approximateSizeBytes + Buffer.byteLength(json(manifest)) >
    MAX_ARCHIVE_SOURCE_BYTES
  )
    throw new Error("La exportación supera el límite de 100 MB.");
  entries.unshift({ name: "manifest.json", content: json(manifest) });
  return {
    entries,
    approximateSizeBytes:
      approximateSizeBytes + Buffer.byteLength(json(manifest)),
    displayName:
      `${profile.first_name ?? ""}-${profile.last_name ?? ""}`.trim() ||
      "cliente",
  };
}

export function createClientArchiveStream(entries: readonly ArchiveEntry[]) {
  const output = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on("warning", (error) => output.destroy(error));
  archive.on("error", (error) => output.destroy(error));
  archive.pipe(output);
  for (const entry of entries)
    archive.append(
      "content" in entry ? entry.content : Readable.from(entry.load()),
      { name: entry.name },
    );
  output.on("close", () => archive.abort());
  void archive.finalize().catch((error) => output.destroy(error));
  return output;
}

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function uniqueFilename(filename: string, used: ReadonlySet<string>) {
  if (!used.has(filename)) return filename;
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const extension = dot > 0 ? filename.slice(dot) : "";
  let index = 2;
  while (used.has(`${stem}-${index}${extension}`)) index += 1;
  return `${stem}-${index}${extension}`;
}

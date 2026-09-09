"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { encryptHealthValue, hashHealthContent } from "@/lib/health/crypto";
import type {
  HealthDecision,
  HealthScreeningPayload,
  YesNo,
} from "@/lib/health/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type HealthActionState = {
  status: "idle" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function yesNo(data: FormData, name: string): YesNo | null {
  const value = text(data, name);
  return value === "yes" || value === "no" ? value : null;
}

export async function submitHealthScreening(
  _state: HealthActionState,
  formData: FormData,
): Promise<HealthActionState> {
  const account = await requireRole("client");
  const riskAnswers = {
    heartCondition: yesNo(formData, "heartCondition"),
    chestPain: yesNo(formData, "chestPain"),
    dizzinessOrFainting: yesNo(formData, "dizzinessOrFainting"),
    highBloodPressureOrDiabetes: yesNo(formData, "highBloodPressureOrDiabetes"),
    boneOrJointProblem: yesNo(formData, "boneOrJointProblem"),
    supervisedActivityOnly: yesNo(formData, "supervisedActivityOnly"),
  };
  if (Object.values(riskAnswers).some((answer) => answer === null)) {
    return {
      status: "error",
      message: "Responde todas las preguntas de seguridad.",
    };
  }

  const sex = text(formData, "sex");
  const smoking = text(formData, "smoking");
  const activityLevel = text(formData, "activityLevel");
  const weightKg = Number(text(formData, "weightKg"));
  const heightCm = Number(text(formData, "heightCm"));
  const signedName = text(formData, "signedName");
  const emergencyName = text(formData, "emergencyName");
  const emergencyPhone = text(formData, "emergencyPhone");
  const emergencyRelationship = text(formData, "emergencyRelationship");
  if (
    !["female", "male", "other", "prefer_not_to_say"].includes(sex) ||
    !["never", "current", "former"].includes(smoking) ||
    !["sedentary", "occasional", "active"].includes(activityLevel) ||
    !Number.isFinite(weightKg) ||
    weightKg < 25 ||
    weightKg > 350 ||
    !Number.isFinite(heightCm) ||
    heightCm < 100 ||
    heightCm > 250 ||
    !emergencyName ||
    !emergencyPhone ||
    !emergencyRelationship ||
    signedName.length < 3
  ) {
    return {
      status: "error",
      message: "Revisa los datos generales y la firma.",
    };
  }
  if (
    formData.get("sensitiveDataAccepted") !== "on" ||
    formData.get("truthAccepted") !== "on" ||
    formData.get("liabilityAccepted") !== "on"
  ) {
    return {
      status: "error",
      message: "Debes aceptar las tres declaraciones.",
    };
  }

  const pregnancyApplies = formData.get("pregnancyApplies") === "on";
  const pregnancyWeeks = pregnancyApplies
    ? Number(text(formData, "pregnancyWeeks"))
    : null;
  if (
    pregnancyApplies &&
    (pregnancyWeeks === null ||
      !Number.isInteger(pregnancyWeeks) ||
      pregnancyWeeks < 1 ||
      pregnancyWeeks > 42)
  ) {
    return { status: "error", message: "Indica las semanas de gestación." };
  }

  const signedAt = new Date().toISOString();
  const payload: HealthScreeningPayload = {
    fullName: account.displayName,
    birthDate: account.birthDate,
    sex: sex as HealthScreeningPayload["sex"],
    weightKg,
    heightCm,
    emergencyContact: {
      name: emergencyName,
      phone: emergencyPhone,
      relationship: emergencyRelationship,
    },
    physician: text(formData, "physicianName")
      ? {
          name: text(formData, "physicianName"),
          phone: text(formData, "physicianPhone"),
        }
      : null,
    riskAnswers: riskAnswers as HealthScreeningPayload["riskAnswers"],
    chronicConditions: formData
      .getAll("chronicConditions")
      .filter((value): value is string => typeof value === "string"),
    otherChronicConditions: text(formData, "otherChronicConditions"),
    surgeries: text(formData, "surgeries"),
    injuries: text(formData, "injuryArea")
      ? [
          {
            area: text(formData, "injuryArea"),
            approximateDate: text(formData, "injuryDate"),
            details: text(formData, "injuryDetails"),
          },
        ]
      : [],
    medications: text(formData, "medications"),
    allergies: text(formData, "allergies"),
    pregnancy: { applies: pregnancyApplies, weeks: pregnancyWeeks },
    smoking: smoking as HealthScreeningPayload["smoking"],
    activityLevel: activityLevel as HealthScreeningPayload["activityLevel"],
    sensitiveDataAccepted: true,
    truthAccepted: true,
    liabilityAccepted: true,
    signedName,
    signedAt,
  };
  const hasCriticalRisk = Object.values(payload.riskAnswers).includes("yes");
  const encrypted = encryptHealthValue(payload);
  const supabase = createClient(await cookies());
  const { data: screeningId, error } = await createAdminClient().rpc(
    "submit_encrypted_health_screening",
    {
      p_client_id: account.user.id,
      p_has_critical_risk: hasCriticalRisk,
      p_encrypted: {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
        keyVersion: encrypted.keyVersion ?? 1,
      },
      p_content_hash: hashHealthContent(payload),
    },
  );
  const screening = screeningId ? { id: screeningId } : null;
  if (error || !screening) {
    return {
      status: "error",
      message: error?.message ?? "No fue posible guardar la evaluación.",
    };
  }

  const document = formData.get("document");
  if (document instanceof File && document.size > 0) {
    const uploadError = await uploadHealthDocument(
      supabase,
      account.user.id,
      screening.id,
      document,
      text(formData, "documentPurpose") === "official_parq_plus"
        ? "official_parq_plus"
        : "medical_clearance",
    );
    if (uploadError) {
      revalidateHealthViews();
      return {
        status: "error",
        message: `La evaluación quedó guardada, pero el archivo no: ${uploadError}`,
      };
    }
  }

  revalidateHealthViews();
  redirect("/client/health?submitted=1");
}

async function uploadHealthDocument(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  screeningId: string,
  file: File,
  purpose: "official_parq_plus" | "medical_clearance",
) {
  if (!allowedMimeTypes.has(file.type) || file.size > 10 * 1024 * 1024) {
    return "usa PDF, JPG o PNG de máximo 10 MB.";
  }
  const extension =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : "jpg";
  const storagePath = `${clientId}/${screeningId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("medical-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return uploadError.message;
  const { error: metadataError } = await createAdminClient()
    .from("health_documents")
    .insert({
      screening_id: screeningId,
      client_id: clientId,
      uploaded_by: clientId,
      purpose,
      storage_path: storagePath,
      original_name: file.name.slice(0, 180),
      mime_type: file.type,
      size_bytes: file.size,
    });
  if (metadataError) {
    await createAdminClient()
      .storage.from("medical-documents")
      .remove([storagePath]);
    return metadataError.message;
  }
  return null;
}

export async function reviewHealthScreening(formData: FormData) {
  const account = await requireRole("trainer");
  const screeningId = text(formData, "screeningId");
  const clientId = text(formData, "clientId");
  const decision = text(formData, "decision") as HealthDecision;
  const notes = text(formData, "notes");
  if (
    !uuidPattern.test(screeningId) ||
    !uuidPattern.test(clientId) ||
    ![
      "cleared",
      "cleared_with_restrictions",
      "medical_clearance_required",
    ].includes(decision)
  ) {
    redirect("/trainer/medical?error=Revisión inválida");
  }
  const encrypted = notes ? encryptHealthValue(notes) : null;
  const { error } = await createAdminClient().rpc(
    "record_encrypted_health_review",
    {
      p_trainer_id: account.user.id,
      p_client_id: clientId,
      p_screening_id: screeningId,
      p_decision: decision,
      p_encrypted: encrypted
        ? {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            tag: encrypted.tag,
            keyVersion: encrypted.keyVersion ?? 1,
          }
        : null,
    },
  );
  if (error)
    redirect(
      `/trainer/medical/${clientId}?error=${encodeURIComponent(error.message)}`,
    );
  revalidateHealthViews();
  redirect(`/trainer/medical/${clientId}?reviewed=1`);
}

function revalidateHealthViews() {
  revalidatePath("/client/health");
  revalidatePath("/trainer/medical");
  revalidatePath("/trainer/clients");
  revalidatePath("/trainer/routines");
}

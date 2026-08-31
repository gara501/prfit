"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type MeasurementFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};
const optionalNumber = (formData: FormData, field: string) => {
  const value = text(formData, field);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export async function saveMeasurement(
  _state: MeasurementFormState,
  formData: FormData,
): Promise<MeasurementFormState> {
  const account = await requireRole("trainer");
  const measurementId = text(formData, "measurementId");
  const clientId = text(formData, "clientId");
  const date = text(formData, "date");
  const notes = text(formData, "notes");
  const values = {
    weight: optionalNumber(formData, "weight"),
    height: optionalNumber(formData, "height"),
    fat_percentage: optionalNumber(formData, "fatPercentage"),
    neck: optionalNumber(formData, "neck"),
    chest: optionalNumber(formData, "chest"),
    shoulders: optionalNumber(formData, "shoulders"),
    waist: optionalNumber(formData, "waist"),
    hips: optionalNumber(formData, "hips"),
    right_arm: optionalNumber(formData, "rightArm"),
    left_arm: optionalNumber(formData, "leftArm"),
    right_leg: optionalNumber(formData, "rightLeg"),
    left_leg: optionalNumber(formData, "leftLeg"),
  };

  if (
    (measurementId && !uuidPattern.test(measurementId)) ||
    !uuidPattern.test(clientId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Object.values(values).some((value) => Number.isNaN(value)) ||
    notes.length > 2000
  ) {
    return { status: "error", message: "Revisa los valores de la medición." };
  }

  if (Object.values(values).every((value) => value === null)) {
    return {
      status: "error",
      message: "Registra al menos un valor corporal.",
    };
  }

  const supabase = createClient(await cookies());
  const payload = {
    client_id: clientId,
    trainer_id: account.user.id,
    date,
    notes: notes || null,
    ...values,
  };
  const result = measurementId
    ? await supabase
        .from("body_compositions")
        .update(payload)
        .eq("id", measurementId)
        .eq("trainer_id", account.user.id)
        .select("id")
        .single()
    : await supabase
        .from("body_compositions")
        .insert(payload)
        .select("id")
        .single();

  if (result.error) {
    return {
      status: "error",
      message:
        result.error.code === "23505"
          ? "Ya existe una medición para este cliente en esa fecha."
          : result.error.message,
    };
  }

  revalidatePath("/trainer/measurements");
  revalidatePath("/client");
  return {
    status: "success",
    message: measurementId
      ? "La medición se actualizó correctamente."
      : "La medición quedó registrada.",
  };
}

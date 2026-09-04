"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { normalizeYouTubeUrl } from "./youtube";

export type ExerciseActionState = {
  status: "idle" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};

const ids = (formData: FormData, field: string) =>
  formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string")
    .filter((value) => uuidPattern.test(value));

export async function saveExercise(
  _state: ExerciseActionState,
  formData: FormData,
): Promise<ExerciseActionState> {
  const account = await requireRole("trainer");
  const exerciseId = text(formData, "exerciseId");
  const name = text(formData, "name");
  const imageUrl = text(formData, "imageUrl");
  const videoInput = text(formData, "videoUrl");
  const videoUrl = videoInput ? normalizeYouTubeUrl(videoInput) : null;
  const bodyZoneIds = ids(formData, "bodyZoneIds");
  const equipmentIds = ids(formData, "equipmentIds");

  if (
    (exerciseId && !uuidPattern.test(exerciseId)) ||
    name.length < 2 ||
    name.length > 100
  ) {
    return { status: "error", message: "Usa un nombre de 2 a 100 caracteres." };
  }
  if (imageUrl && !isHttpsUrl(imageUrl)) {
    return {
      status: "error",
      message: "La imagen debe usar una URL HTTPS válida.",
    };
  }
  if (videoInput && !videoUrl) {
    return {
      status: "error",
      message: "Usa un enlace HTTPS válido de YouTube.",
    };
  }

  const supabase = createClient(await cookies());
  const values = {
    name,
    image_url: imageUrl || null,
    video_url: videoUrl,
  };
  const exerciseResult = exerciseId
    ? await supabase
        .from("exercises")
        .update(values)
        .eq("id", exerciseId)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("exercises")
        .insert({ ...values, created_by: account.user.id })
        .select("id")
        .single();

  if (exerciseResult.error || !exerciseResult.data) {
    return {
      status: "error",
      message:
        exerciseResult.error?.message ?? "No fue posible guardar el ejercicio.",
    };
  }

  const savedId = exerciseResult.data.id;
  const [bodyZoneDelete, equipmentDelete] = await Promise.all([
    supabase.from("exercise_body_zones").delete().eq("exercise_id", savedId),
    supabase.from("exercise_equipment").delete().eq("exercise_id", savedId),
  ]);
  const deleteError = bodyZoneDelete.error ?? equipmentDelete.error;
  if (deleteError) return { status: "error", message: deleteError.message };

  const [bodyZoneInsert, equipmentInsert] = await Promise.all([
    bodyZoneIds.length
      ? supabase.from("exercise_body_zones").insert(
          bodyZoneIds.map((bodyZoneId) => ({
            exercise_id: savedId,
            body_zone_id: bodyZoneId,
          })),
        )
      : Promise.resolve({ error: null }),
    equipmentIds.length
      ? supabase.from("exercise_equipment").insert(
          equipmentIds.map((equipmentId) => ({
            exercise_id: savedId,
            equipment_id: equipmentId,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);
  const relationError = bodyZoneInsert.error ?? equipmentInsert.error;
  if (relationError) return { status: "error", message: relationError.message };

  revalidateExerciseViews();
  redirect(
    `/trainer/exercises?success=${encodeURIComponent(exerciseId ? "Ejercicio actualizado." : "Ejercicio creado.")}`,
  );
}

export async function deleteExercise(formData: FormData) {
  await requireRole("trainer");
  const exerciseId = text(formData, "exerciseId");
  if (!uuidPattern.test(exerciseId)) redirect("/trainer/exercises");

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    const message =
      error?.code === "23503"
        ? "No puedes eliminar un ejercicio que ya forma parte de una rutina."
        : (error?.message ?? "No fue posible eliminar el ejercicio.");
    redirect(`/trainer/exercises?error=${encodeURIComponent(message)}`);
  }

  revalidateExerciseViews();
  redirect(
    `/trainer/exercises?success=${encodeURIComponent("Ejercicio eliminado.")}`,
  );
}

function revalidateExerciseViews() {
  revalidatePath("/trainer/exercises");
  revalidatePath("/trainer/routines");
  revalidatePath("/trainer/routines/new");
  revalidatePath("/trainer/routines/templates");
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

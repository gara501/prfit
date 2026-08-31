"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { normalizeYouTubeUrl } from "@/lib/exercises/youtube";
import { createClient } from "@/lib/supabase/server";

export type RoutineActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (data: FormData, field: string) => {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
};

export async function saveRoutineDraft(
  _state: RoutineActionState,
  formData: FormData,
): Promise<RoutineActionState> {
  await requireRole("trainer");
  const routineId = text(formData, "routineId");
  const clientId = text(formData, "clientId");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const daysAtWeek = Number(text(formData, "daysAtWeek"));
  const effortMetric = text(formData, "effortMetric");
  const exercisesJson = text(formData, "exercises");

  if (
    (routineId && !uuidPattern.test(routineId)) ||
    !uuidPattern.test(clientId) ||
    !name ||
    !startDate ||
    !Number.isInteger(daysAtWeek) ||
    daysAtWeek < 1 ||
    daysAtWeek > 7 ||
    !["rir", "rpe"].includes(effortMetric)
  ) {
    return {
      status: "error",
      message: "Revisa los datos generales del borrador.",
    };
  }

  let exercises: unknown;
  try {
    exercises = JSON.parse(exercisesJson);
  } catch {
    return { status: "error", message: "No fue posible leer los ejercicios." };
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return {
      status: "error",
      message: "Agrega al menos un ejercicio con una serie al borrador.",
    };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("save_routine_draft", {
    p_routine_id: routineId || null,
    p_client_id: clientId,
    p_name: name,
    p_description: description || null,
    p_start_date: startDate,
    p_end_date: endDate || null,
    p_days_at_week: daysAtWeek,
    p_exercises: exercises,
    p_effort_metric: effortMetric,
  });

  if (error || typeof data !== "string") {
    return {
      status: "error",
      message: error?.message ?? "No fue posible guardar el borrador.",
    };
  }

  revalidateRoutineViews();
  redirect(`/trainer/routines/${data}`);
}

export async function deleteRoutineDraft(formData: FormData) {
  const account = await requireRole("trainer");
  const routineId = text(formData, "routineId");
  if (!uuidPattern.test(routineId)) redirect("/trainer/routines");

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("trainer_id", account.user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/trainer/routines/${routineId}?error=${encodeURIComponent(error?.message ?? "No fue posible eliminar el borrador.")}`,
    );
  }

  revalidateRoutineViews();
  redirect("/trainer/routines");
}

export async function cloneRoutineVersion(formData: FormData) {
  await requireRole("trainer");
  const routineId = text(formData, "routineId");
  if (!uuidPattern.test(routineId)) redirect("/trainer/routines");

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("clone_routine_version", {
    p_source_routine_id: routineId,
  });

  if (error || typeof data !== "string") {
    redirect(
      `/trainer/routines/${routineId}?error=${encodeURIComponent(error?.message ?? "No fue posible crear una nueva versión.")}`,
    );
  }

  revalidateRoutineViews();
  redirect(`/trainer/routines/${data}/edit`);
}

export async function publishRoutineVersion(formData: FormData) {
  await requireRole("trainer");
  const routineId = text(formData, "routineId");
  if (!uuidPattern.test(routineId)) redirect("/trainer/routines");

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("publish_routine_version", {
    p_routine_id: routineId,
  });

  if (error || typeof data !== "string") {
    redirect(
      `/trainer/routines/${routineId}?error=${encodeURIComponent(error?.message ?? "No fue posible publicar el plan.")}`,
    );
  }

  revalidateRoutineViews();
  redirect(`/trainer/routines/${data}`);
}

export async function archiveRoutineVersion(formData: FormData) {
  await requireRole("trainer");
  const routineId = text(formData, "routineId");
  if (!uuidPattern.test(routineId)) redirect("/trainer/routines");

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("archive_routine_version", {
    p_routine_id: routineId,
  });

  if (error || typeof data !== "string") {
    redirect(
      `/trainer/routines/${routineId}?error=${encodeURIComponent(error?.message ?? "No fue posible archivar el plan.")}`,
    );
  }

  revalidateRoutineViews();
  redirect(`/trainer/routines/${data}`);
}

function revalidateRoutineViews() {
  revalidatePath("/trainer");
  revalidatePath("/trainer/routines");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}

export async function createExercise(
  _state: RoutineActionState,
  formData: FormData,
): Promise<RoutineActionState> {
  const account = await requireRole("trainer");
  const name = text(formData, "exerciseName");
  const videoInput = text(formData, "exerciseVideoUrl");
  const videoUrl = videoInput ? normalizeYouTubeUrl(videoInput) : null;
  const currentPath = text(formData, "currentPath");

  if (name.length < 2 || name.length > 100) {
    return { status: "error", message: "Usa un nombre de 2 a 100 caracteres." };
  }

  if (videoInput && !videoUrl) {
    return {
      status: "error",
      message: "Usa un enlace HTTPS válido de YouTube.",
    };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("exercises").insert({
    name,
    created_by: account.user.id,
    video_url: videoUrl,
  });

  if (error) return { status: "error", message: error.message };
  if (currentPath.startsWith("/trainer/routines")) revalidatePath(currentPath);
  return { status: "success", message: `“${name}” ya está disponible.` };
}

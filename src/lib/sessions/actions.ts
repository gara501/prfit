"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function startWorkoutSession(formData: FormData) {
  await requireRole("client");
  const routineId = formData.get("routineId");
  const dayNumber = Number(formData.get("dayNumber"));
  if (typeof routineId !== "string" || !uuidPattern.test(routineId)) {
    redirect("/client/sessions?error=Rutina%20inválida");
  }
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    redirect("/client/sessions?error=D%C3%ADa%20inv%C3%A1lido");
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("start_workout_session", {
    p_routine_id: routineId,
    p_day_number: dayNumber,
  });

  if (error || typeof data !== "string") {
    redirect(
      `/client/sessions?error=${encodeURIComponent(error?.message ?? "No fue posible iniciar la sesión.")}`,
    );
  }

  redirect(`/client/sessions/${data}`);
}

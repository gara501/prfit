"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getTrainerRoutines } from "@/lib/routines/queries";
import { createClient } from "@/lib/supabase/server";

export async function startScheduledWorkout(formData: FormData) {
  await requireRole("client");
  const id = formData.get("scheduledWorkoutId");
  if (typeof id !== "string")
    redirect("/client/calendar?error=Sesión+inválida");
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("start_scheduled_workout", {
    p_scheduled_workout_id: id,
  });
  redirect(
    error || !data
      ? `/client/calendar?error=${encodeURIComponent(error?.message ?? "No fue posible iniciar.")}`
      : `/client/sessions/${data}`,
  );
}
export async function skipScheduledWorkout(formData: FormData) {
  await requireRole("client");
  const id = formData.get("scheduledWorkoutId");
  if (typeof id !== "string")
    redirect("/client/calendar?error=Sesión+inválida");
  const supabase = createClient(await cookies());
  const { error } = await supabase.rpc("skip_scheduled_workout", {
    p_scheduled_workout_id: id,
  });
  revalidatePath("/client/calendar");
  redirect(
    error
      ? `/client/calendar?error=${encodeURIComponent(error.message)}`
      : "/client/calendar?skipped=1",
  );
}
export async function scheduleWorkout(formData: FormData) {
  const account = await requireRole("trainer");
  const routineId = formData.get("routineId");
  const date = formData.get("date");
  const day = Number(formData.get("dayNumber"));
  const { routines } = await getTrainerRoutines();
  const routine = routines.find(
    (item) => item.id === routineId && item.status === "published",
  );
  if (
    !routine ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 7
  )
    redirect("/trainer/calendar?error=Revisa+la+sesión+programada.");
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("scheduled_workouts").insert({
    routine_id: routine.id,
    trainer_id: account.user.id,
    client_id: routine.clientId,
    day_number: day,
    scheduled_date: date,
  });
  revalidatePath("/trainer/calendar");
  redirect(
    error
      ? `/trainer/calendar?error=${encodeURIComponent(error.message)}`
      : "/trainer/calendar?created=1",
  );
}

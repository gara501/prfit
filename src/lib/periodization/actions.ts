"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type PeriodizationActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
};

export async function savePeriodizationPlan(
  _state: PeriodizationActionState,
  formData: FormData,
): Promise<PeriodizationActionState> {
  await requireRole("trainer");
  const planId = text(formData, "planId");
  const clientId = text(formData, "clientId");
  const name = text(formData, "name");
  const goal = text(formData, "goal");
  const startDate = text(formData, "startDate");
  const mesocyclesValue = text(formData, "mesocycles");

  if (
    (planId && !uuidPattern.test(planId)) ||
    !uuidPattern.test(clientId) ||
    name.length < 2 ||
    name.length > 120 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
  ) {
    return { status: "error", message: "Revisa los datos generales del plan." };
  }

  let mesocycles: Json;
  try {
    mesocycles = JSON.parse(mesocyclesValue) as Json;
  } catch {
    return { status: "error", message: "No fue posible leer los mesociclos." };
  }

  if (!Array.isArray(mesocycles) || mesocycles.length === 0) {
    return { status: "error", message: "Agrega al menos un mesociclo." };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("save_periodization_plan", {
    p_plan_id: planId || null,
    p_client_id: clientId,
    p_name: name,
    p_goal: goal,
    p_start_date: startDate,
    p_mesocycles: mesocycles,
  });

  if (error || typeof data !== "string") {
    return {
      status: "error",
      message: error?.message ?? "No fue posible guardar la periodización.",
    };
  }

  revalidatePeriodizationViews();
  redirect(`/trainer/periodization/${data}`);
}

export async function activatePeriodizationPlan(formData: FormData) {
  await requireRole("trainer");
  const planId = text(formData, "planId");
  if (!uuidPattern.test(planId)) redirect("/trainer/periodization");
  const supabase = createClient(await cookies());
  const { error } = await supabase.rpc("activate_periodization_plan", {
    p_plan_id: planId,
  });
  revalidatePeriodizationViews();
  redirect(
    error
      ? `/trainer/periodization/${planId}?error=${encodeURIComponent(error.message)}`
      : `/trainer/periodization/${planId}`,
  );
}

export async function archivePeriodizationPlan(formData: FormData) {
  await requireRole("trainer");
  const planId = text(formData, "planId");
  if (!uuidPattern.test(planId)) redirect("/trainer/periodization");
  const supabase = createClient(await cookies());
  const { error } = await supabase.rpc("archive_periodization_plan", {
    p_plan_id: planId,
  });
  revalidatePeriodizationViews();
  redirect(
    error
      ? `/trainer/periodization/${planId}?error=${encodeURIComponent(error.message)}`
      : `/trainer/periodization/${planId}`,
  );
}

function revalidatePeriodizationViews() {
  revalidatePath("/trainer");
  revalidatePath("/trainer/periodization");
  revalidatePath("/trainer/routines");
  revalidatePath("/client");
}

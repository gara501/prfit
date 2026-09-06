import { notFound, redirect } from "next/navigation";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { getMicrocycleRoutineContext } from "@/lib/periodization/queries";
import { getRoutineWorkspace } from "@/lib/routines/queries";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const { clients, exercises, routine, error } =
    await getRoutineWorkspace(routineId);

  if (!routine) notFound();
  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (routine.status !== "draft") {
    redirect(`/trainer/routines/${routine.id}`);
  }
  const periodizationContext = routine.microcycleId
    ? await getMicrocycleRoutineContext(routine.microcycleId)
    : null;

  return (
    <RoutineEditor
      clients={clients}
      exerciseOptions={exercises}
      periodizationContext={periodizationContext}
      routine={routine}
    />
  );
}

import { ExerciseEditorShell } from "@/components/exercises/ExerciseEditorShell";
import { getExerciseEditorData } from "@/lib/exercises/queries";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const { data, error } = await getExerciseEditorData(exerciseId);
  return <ExerciseEditorShell data={data} error={error} />;
}

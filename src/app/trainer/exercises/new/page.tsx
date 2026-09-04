import { ExerciseEditorShell } from "@/components/exercises/ExerciseEditorShell";
import { getExerciseEditorData } from "@/lib/exercises/queries";

export default async function NewExercisePage() {
  const { data, error } = await getExerciseEditorData();
  return <ExerciseEditorShell data={data} error={error} />;
}

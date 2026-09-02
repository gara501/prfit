import { notFound } from "next/navigation";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { getRoutineTemplateWorkspace } from "@/lib/routines/queries";

export default async function EditRoutineTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const { exercises, template, error } =
    await getRoutineTemplateWorkspace(templateId);
  if (error) {
    return <p className="p-8 text-destructive">{error}</p>;
  }
  if (!template) notFound();

  return (
    <RoutineEditor
      clients={[]}
      exerciseOptions={exercises}
      mode="template"
      routine={null}
      template={template}
    />
  );
}

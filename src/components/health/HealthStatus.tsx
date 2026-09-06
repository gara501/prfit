import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import type { HealthScreeningSummary } from "@/lib/health/types";

export function HealthStatus({
  screening,
}: {
  screening: HealthScreeningSummary | null;
}) {
  if (!screening)
    return <Status icon={Clock3} label="Sin evaluación" tone="muted" />;
  const expired = new Date(screening.expiresAt) <= new Date();
  if (expired)
    return (
      <Status icon={AlertTriangle} label="Evaluación vencida" tone="warning" />
    );
  if (screening.decision === "medical_clearance_required")
    return (
      <Status
        icon={AlertTriangle}
        label="Requiere autorización médica"
        tone="danger"
      />
    );
  if (
    screening.decision === "cleared" ||
    screening.decision === "cleared_with_restrictions"
  )
    return (
      <Status
        icon={CheckCircle2}
        label={
          screening.decision === "cleared"
            ? "Apto revisado"
            : "Apto con restricciones"
        }
        tone="success"
      />
    );
  if (screening.hasCriticalRisk)
    return (
      <Status
        icon={AlertTriangle}
        label="Pendiente de revisión"
        tone="warning"
      />
    );
  return (
    <Status icon={CheckCircle2} label="Sin alertas declaradas" tone="success" />
  );
}

function Status({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  tone: "muted" | "warning" | "danger" | "success";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/15 text-success",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-black ${tones[tone]}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

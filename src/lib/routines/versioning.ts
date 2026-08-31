import type { RoutineVersionStatus } from "./types";

export const routineVersionLabels: Record<RoutineVersionStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

export function canEditRoutineVersion(status: RoutineVersionStatus) {
  return status === "draft";
}

export function canPublishRoutineVersion(status: RoutineVersionStatus) {
  return status === "draft";
}

export function canArchiveRoutineVersion(status: RoutineVersionStatus) {
  return status === "published";
}

export function canCloneRoutineVersion(status: RoutineVersionStatus) {
  return status === "published" || status === "archived";
}

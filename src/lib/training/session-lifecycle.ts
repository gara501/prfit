export const sessionStatuses = [
  "in_progress",
  "completed",
  "abandoned",
] as const;

export type SessionStatus = (typeof sessionStatuses)[number];

export function canCompleteSession(
  status: SessionStatus,
  completedSets: number,
  totalSets: number,
) {
  return (
    status === "in_progress" && totalSets > 0 && completedSets === totalSets
  );
}

export function isSessionEditable(status: SessionStatus) {
  return status === "in_progress";
}

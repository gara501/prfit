import type { ClientAssignment } from "@/lib/assignments/queries";

export const CLIENTS_PER_PAGE = 4;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function getClientDisplayName(assignment: ClientAssignment) {
  return (
    `${assignment.clientFirstName} ${assignment.clientLastName}`.trim() ||
    "Cliente sin nombre"
  );
}

export function filterClientAssignments(
  assignments: ClientAssignment[],
  query: string,
) {
  const searchTerm = normalize(query.trim());

  if (!searchTerm) {
    return assignments;
  }

  return assignments.filter((assignment) =>
    [getClientDisplayName(assignment), assignment.clientEmail]
      .filter(Boolean)
      .some((value) => normalize(value).includes(searchTerm)),
  );
}

export function getClientPageCount(totalClients: number) {
  return Math.max(1, Math.ceil(totalClients / CLIENTS_PER_PAGE));
}

export function getClientPage<T>(items: T[], page: number) {
  const start = (page - 1) * CLIENTS_PER_PAGE;
  return items.slice(start, start + CLIENTS_PER_PAGE);
}

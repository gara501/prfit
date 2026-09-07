import { describe, expect, it } from "vitest";
import {
  CLIENTS_PER_PAGE,
  filterClientAssignments,
  getClientPage,
  getClientPageCount,
} from "@/lib/assignments/client-directory";
import type { ClientAssignment } from "@/lib/assignments/queries";

const assignment = (firstName: string, email: string): ClientAssignment => ({
  clientId: email,
  clientFirstName: firstName,
  clientLastName: "Cliente",
  clientEmail: email,
  clientPhone: "",
  assignmentId: "assignment-id",
  trainerId: "trainer-id",
  trainerFirstName: "Ana",
  trainerLastName: "Trainer",
  startDate: null,
  activeRoutineId: null,
  activeRoutineName: "",
});

describe("client directory", () => {
  const assignments = [
    assignment("María", "maria@example.com"),
    assignment("Carlos", "carlos@example.com"),
    assignment("Lucía", "lucia@example.com"),
    assignment("Andrés", "andres@example.com"),
    assignment("Valentina", "vale@example.com"),
  ];

  it("finds clients by name or email without depending on accents", () => {
    expect(filterClientAssignments(assignments, "maria")).toHaveLength(1);
    expect(filterClientAssignments(assignments, "vale@example")).toHaveLength(
      1,
    );
  });

  it("limits every page to four clients", () => {
    expect(CLIENTS_PER_PAGE).toBe(4);
    expect(getClientPageCount(assignments.length)).toBe(2);
    expect(getClientPage(assignments, 1)).toHaveLength(4);
    expect(getClientPage(assignments, 2)).toEqual([assignments[4]]);
  });
});

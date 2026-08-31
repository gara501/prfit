export const appRoles = ["admin", "trainer", "client"] as const;

export type AppRole = (typeof appRoles)[number];

export const isAppRole = (value: unknown): value is AppRole =>
  appRoles.some((role) => role === value);

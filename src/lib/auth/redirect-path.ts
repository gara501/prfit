const passwordDestinations = new Set([
  "/auth/setup-password",
  "/auth/reset-password",
]);

export function getPasswordRedirectPath(value: string | null) {
  return value && passwordDestinations.has(value)
    ? value
    : "/auth/setup-password";
}

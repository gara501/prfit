import { requireRole } from "@/lib/auth/require-role";

export async function requireAdmin() {
  const { user } = await requireRole("admin");
  return user;
}

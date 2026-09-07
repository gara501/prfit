import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, user } = await requireRole("admin");

  return (
    <AppShell userRole="admin" displayName={displayName} userId={user.id}>
      {children}
    </AppShell>
  );
}

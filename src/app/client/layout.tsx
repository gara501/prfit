import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/require-role";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, user } = await requireRole("client");

  return (
    <AppShell userRole="client" displayName={displayName} userId={user.id}>
      {children}
    </AppShell>
  );
}

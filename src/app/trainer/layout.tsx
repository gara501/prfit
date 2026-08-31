import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/require-role";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName } = await requireRole("trainer");

  return (
    <AppShell userRole="trainer" displayName={displayName}>
      {children}
    </AppShell>
  );
}

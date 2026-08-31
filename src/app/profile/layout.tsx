import { AppShell } from "@/components/layout/AppShell";
import { requireAuthenticatedAccount } from "@/lib/auth/require-role";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, role } = await requireAuthenticatedAccount();

  return (
    <AppShell userRole={role} displayName={displayName}>
      {children}
    </AppShell>
  );
}

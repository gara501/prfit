import { PasswordPage } from "@/components/auth/PasswordPage";

export default async function SetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <PasswordPage error={error} mode="setup" />;
}

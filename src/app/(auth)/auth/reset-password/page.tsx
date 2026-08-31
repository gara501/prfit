import { PasswordPage } from "@/components/auth/PasswordPage";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <PasswordPage error={error} mode="reset" />;
}

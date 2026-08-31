import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/auth/setup-password";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=El enlace no es válido o ya expiró.", url.origin),
    );
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=El enlace no es válido o ya expiró.", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

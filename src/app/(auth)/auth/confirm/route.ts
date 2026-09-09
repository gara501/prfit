import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPasswordRedirectPath } from "@/lib/auth/redirect-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getPasswordRedirectPath(url.searchParams.get("next"));

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabasePublicConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function getAuthRedirectUrl(pathname: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_SITE_URL para generar enlaces de onboarding seguros.",
    );
  }

  return new URL(pathname, siteUrl).toString();
}

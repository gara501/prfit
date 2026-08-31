import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) => {
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicConfig();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot persist response cookies. Middleware
          // refreshes the session for those requests.
        }
      },
    },
  });
};

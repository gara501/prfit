import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./config";

export const createClient = () => {
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicConfig();
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
};

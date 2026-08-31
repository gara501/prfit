import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export const createClient = () => {
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicConfig();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
};

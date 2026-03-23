import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Creates a Supabase client for browser/client components.
 * Uses the anon key - safe to use in client-side code.
 * For mutations, always use Server Actions instead of direct calls.
 *
 * Uses singleton pattern to ensure realtime subscriptions work correctly.
 */
export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

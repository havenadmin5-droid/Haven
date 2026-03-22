import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser/client components.
 * Uses the anon key - safe to use in client-side code.
 * For mutations, always use Server Actions instead of direct calls.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

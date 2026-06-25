import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Route Handlers (API routes).
 * This client does NOT depend on cookies() and is safe for POST handlers.
 * It uses the service role key for admin operations,
 * or anon key for auth operations like signInWithPassword.
 */
export function createRouteHandlerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function createRouteHandlerAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

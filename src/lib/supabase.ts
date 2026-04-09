import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}
function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

// Lazy-initialized anon client for public reads (avoids build-time crash)
let _supabaseAnon: SupabaseClient | null = null;
export function getSupabaseAnon() {
  if (!_supabaseAnon) {
    _supabaseAnon = createClient(getUrl(), getAnonKey());
  }
  return _supabaseAnon;
}

// Authenticated client for user-specific writes
export function createClerkSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(getUrl(), getAnonKey(), {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken();
        const headers = new Headers(options.headers);
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }
        return fetch(url, { ...options, headers });
      },
    },
  });
}

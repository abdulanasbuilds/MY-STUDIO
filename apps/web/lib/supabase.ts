// MY STUDIO — supabase.ts (CLIENT ONLY)
// PURPOSE: Supabase browser client factory. Does NOT import next/headers.

import { createBrowserClient as createBrowser } from '@supabase/ssr';

export function createBrowserClient() {
  return createBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

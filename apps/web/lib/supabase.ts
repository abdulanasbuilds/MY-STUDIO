// MY STUDIO — supabase.ts
// PURPOSE: Supabase client factories for browser and server contexts

import { createBrowserClient as createBrowser } from '@supabase/ssr';
import { createServerClient as createServer } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses NEXT_PUBLIC_ env vars which are exposed to the browser.
 */
export function createBrowserClient() {
  return createBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Creates a Supabase client for use in Server Components, API routes,
 * and Server Actions. Reads/writes cookies for session management.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // setAll can fail in Server Components where cookies are read-only.
            // This is expected — session refresh will be handled by middleware.
          }
        },
      },
    },
  );
}

/**
 * Helper: get the authenticated user from a server context.
 * Returns null if not authenticated. Always uses getUser() (never getSession()).
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

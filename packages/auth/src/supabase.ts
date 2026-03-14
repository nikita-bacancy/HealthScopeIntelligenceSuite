import type { CookieOptions } from "@supabase/ssr";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, requireEnv } from "@healthscope/config";

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set?: (input: { name: string; value: string } & CookieOptions) => void;
};

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function createSupabaseServerClient(cookieStore: CookieStore) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set?.({ name, value, ...options });
          } catch {
            // Next.js allows cookies.set only in Server Actions or Route Handlers.
            // No-op here so Server Component renders (e.g. page load) do not throw.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set?.({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Same as set: no-op when not in an action or route handler.
          }
        }
      }
    }
  );
}

export function createSupabaseMiddlewareClient(
  request: Request,
  response: {
    cookies: {
      get(name: string): { value: string } | undefined;
      set(input: { name: string; value: string } & CookieOptions): void;
    };
  }
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return response.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        }
      },
      global: {
        headers: {
          "x-forwarded-host": new URL(request.url).host
        }
      }
    }
  );
}

export function createSupabaseAdminClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Dynamically import cookies to handle contexts where next/headers isn't available
async function getCookies() {
  try {
    const { cookies } = await import('next/headers')
    return await cookies()
  } catch (_error) {
    // next/headers is not available in this context
    return null
  }
}

export function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await getCookies()
          if (!cookieStore) {
            // Fallback: return undefined if cookies aren't available
            return undefined
          }
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await getCookies()
            if (cookieStore) {
              cookieStore.set({ name, value, ...options })
            }
          } catch (_error) {
            // The `set` method was called from a context where cookies can't be set.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await getCookies()
            if (cookieStore) {
              cookieStore.set({ name, value: '', ...options })
            }
          } catch (_error) {
            // The `delete` method was called from a context where cookies can't be removed.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Alternative server client for contexts where we know cookies are available
export function createSupabaseServerClientWithCookies() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const { cookies } = await import('next/headers')
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const { cookies } = await import('next/headers')
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

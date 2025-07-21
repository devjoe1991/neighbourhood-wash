import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { 
  shouldSkipAuth, 
  getEnvironmentConfig, 
  logBuildContext 
} from '@/lib/utils/build-context'

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

export interface SafeSupabaseResult {
  client: ReturnType<typeof createServerClient> | null
  error?: string
  isBuildContext: boolean
}

/**
 * Create Supabase server client with build-time safety
 * Throws error during runtime issues, but handles build-time gracefully
 */
export function createSupabaseServerClient() {
  const result = createSupabaseServerClientSafe()
  
  if (!result.client) {
    if (result.isBuildContext) {
      // During build, log the context but throw to maintain existing behavior
      logBuildContext('Supabase client creation skipped during build')
      throw new Error('Build context: Supabase client not available during static generation')
    } else {
      // During runtime, throw the actual error
      throw new Error(result.error || 'Failed to create Supabase client')
    }
  }
  
  return result.client
}

/**
 * Create Supabase server client with comprehensive error handling
 * Returns result object instead of throwing
 */
export function createSupabaseServerClientSafe(): SafeSupabaseResult {
  // Check if we should skip authentication during build
  if (shouldSkipAuth()) {
    logBuildContext('Skipping Supabase client creation during build')
    return {
      client: null,
      error: 'Build context: Authentication skipped during static generation',
      isBuildContext: true
    }
  }

  // Validate environment configuration
  const envConfig = getEnvironmentConfig()
  
  if (!envConfig.isConfigured) {
    const error = `Missing Supabase environment variables: ${envConfig.missingVars.join(', ')}`
    console.error('[SUPABASE_CLIENT]', error)
    
    return {
      client: null,
      error,
      isBuildContext: false
    }
  }

  try {
    const client = createServerClient(envConfig.supabaseUrl!, envConfig.supabaseAnonKey!, {
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
    })

    return {
      client,
      isBuildContext: false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating Supabase client'
    console.error('[SUPABASE_CLIENT] Failed to create client:', errorMessage)
    
    return {
      client: null,
      error: errorMessage,
      isBuildContext: false
    }
  }
}

// Alternative server client for contexts where we know cookies are available
export function createSupabaseServerClientWithCookies() {
  // Check build context first
  if (shouldSkipAuth()) {
    logBuildContext('Skipping Supabase client creation during build (with cookies)')
    throw new Error('Build context: Supabase client not available during static generation')
  }

  // Validate environment configuration
  const envConfig = getEnvironmentConfig()
  
  if (!envConfig.isConfigured) {
    const error = `Missing Supabase environment variables: ${envConfig.missingVars.join(', ')}`
    console.error('[SUPABASE_CLIENT]', error)
    throw new Error(error)
  }

  return createServerClient(envConfig.supabaseUrl!, envConfig.supabaseAnonKey!, {
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
  })
}
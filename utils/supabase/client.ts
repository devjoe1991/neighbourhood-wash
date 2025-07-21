import { createBrowserClient } from '@supabase/ssr'
import { 
  getEnvironmentConfig, 
  logBuildContext,
  isBuildTime 
} from '@/lib/utils/build-context'

export interface SafeSupabaseBrowserResult {
  client: ReturnType<typeof createBrowserClient> | null
  error?: string
  isBuildContext: boolean
}

/**
 * Create Supabase browser client with build-time safety
 * Throws error during runtime issues, but handles build-time gracefully
 */
export function createClient() {
  const result = createClientSafe()
  
  if (!result.client) {
    if (result.isBuildContext) {
      // During build, log the context but throw to maintain existing behavior
      logBuildContext('Supabase browser client creation skipped during build')
      throw new Error('Build context: Supabase client not available during static generation')
    } else {
      // During runtime, throw the actual error
      throw new Error(result.error || 'Failed to create Supabase browser client')
    }
  }
  
  return result.client
}

/**
 * Create Supabase browser client with comprehensive error handling
 * Returns result object instead of throwing
 */
export function createClientSafe(): SafeSupabaseBrowserResult {
  // Check if we're in build context
  const buildContext = isBuildTime()
  
  if (buildContext) {
    logBuildContext('Skipping Supabase browser client creation during build')
    return {
      client: null,
      error: 'Build context: Browser client skipped during static generation',
      isBuildContext: true
    }
  }

  // Validate environment configuration
  const envConfig = getEnvironmentConfig()
  
  if (!envConfig.isConfigured) {
    const error = `Missing Supabase environment variables: ${envConfig.missingVars.join(', ')}`
    console.error('[SUPABASE_BROWSER_CLIENT]', error)
    
    return {
      client: null,
      error,
      isBuildContext: false
    }
  }

  try {
    const client = createBrowserClient(
      envConfig.supabaseUrl!,
      envConfig.supabaseAnonKey!
    )

    return {
      client,
      isBuildContext: false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating Supabase browser client'
    console.error('[SUPABASE_BROWSER_CLIENT] Failed to create client:', errorMessage)
    
    return {
      client: null,
      error: errorMessage,
      isBuildContext: false
    }
  }
}

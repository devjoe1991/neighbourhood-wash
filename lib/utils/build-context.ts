/**
 * Build Context Detection Utilities
 * 
 * Provides utilities to detect whether code is running during build time
 * or runtime, and handle environment configuration safely.
 */

export interface BuildContext {
  isBuild: boolean
  isStatic: boolean
  environment: 'development' | 'production' | 'test'
  hasEnvironmentVars: boolean
  timestamp: string
}

export interface EnvironmentConfig {
  supabaseUrl?: string
  supabaseAnonKey?: string
  isConfigured: boolean
  missingVars: string[]
}

/**
 * Detect if code is currently running during build time
 */
export function isBuildTime(): boolean {
  // Check for Next.js build environment
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return true
  }

  // Check for build-specific environment variables
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true
  }

  // Check if we're in a static generation context
  try {
    // This will fail during build time
    const { headers } = require('next/headers')
    return false
  } catch {
    return true
  }
}

/**
 * Detect if we're in static generation mode
 */
export function isStaticGeneration(): boolean {
  try {
    // Try to access request context - will fail during static generation
    const { cookies } = require('next/headers')
    return false
  } catch {
    return true
  }
}

/**
 * Get the current environment context
 */
export function getEnvironmentContext(): 'build' | 'runtime' | 'development' {
  if (process.env.NODE_ENV === 'development') {
    return 'development'
  }

  if (isBuildTime()) {
    return 'build'
  }

  return 'runtime'
}

/**
 * Get comprehensive build context information
 */
export function getBuildContext(): BuildContext {
  const envConfig = getEnvironmentConfig()
  
  return {
    isBuild: isBuildTime(),
    isStatic: isStaticGeneration(),
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'production',
    hasEnvironmentVars: envConfig.isConfigured,
    timestamp: new Date().toISOString()
  }
}

/**
 * Validate and get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const missingVars: string[] = []
  
  if (!supabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  
  if (!supabaseAnonKey) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: missingVars.length === 0,
    missingVars
  }
}

/**
 * Safe environment variable getter with fallbacks
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  const value = process.env[key]
  
  if (!value && fallback !== undefined) {
    console.warn(`[BUILD_CONTEXT] Environment variable ${key} not found, using fallback`)
    return fallback
  }
  
  return value
}

/**
 * Log build context information for debugging
 */
export function logBuildContext(context?: string): void {
  const buildContext = getBuildContext()
  const envConfig = getEnvironmentConfig()
  
  console.log(`[BUILD_CONTEXT] ${context || 'Context check'}:`, {
    isBuild: buildContext.isBuild,
    isStatic: buildContext.isStatic,
    environment: buildContext.environment,
    hasEnvironmentVars: buildContext.hasEnvironmentVars,
    missingVars: envConfig.missingVars,
    timestamp: buildContext.timestamp
  })
}

/**
 * Check if we should skip authentication-dependent operations
 */
export function shouldSkipAuth(): boolean {
  const context = getBuildContext()
  
  // Skip auth during build or if environment is not configured
  if (context.isBuild || context.isStatic || !context.hasEnvironmentVars) {
    logBuildContext('Skipping authentication')
    return true
  }
  
  return false
}

/**
 * Get safe defaults for build-time operations
 */
export function getBuildSafeDefaults() {
  return {
    user: null,
    isAuthenticated: false,
    canAccess: false,
    status: 'build_context',
    reason: 'build_time_execution',
    message: 'Authentication skipped during build process'
  }
}
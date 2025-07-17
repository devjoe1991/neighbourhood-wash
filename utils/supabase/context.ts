import { createSupabaseServerClient } from './server'
import { createClient as createSupabaseClient } from './client'
import { createClient as createMiddlewareClient } from './middleware'
import { type NextRequest, type NextResponse } from 'next/server'

/**
 * Detects the current execution context and returns the appropriate Supabase client
 */
export function getSupabaseClient() {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return createSupabaseClient()
  }
  
  // For server-side contexts, use the context-aware server client
  return createSupabaseServerClient()
}

/**
 * Creates a Supabase client specifically for middleware context
 */
export function getSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createMiddlewareClient(request, response)
}

/**
 * Utility to check if we're in a server context
 */
export function isServerContext(): boolean {
  return typeof window === 'undefined'
}

/**
 * Utility to check if we're in a browser context
 */
export function isBrowserContext(): boolean {
  return typeof window !== 'undefined'
}
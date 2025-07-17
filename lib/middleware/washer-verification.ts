import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { canAccessWasherFeatures } from '@/lib/stripe/actions'

/**
 * Middleware to check washer verification status and control access to washer-specific features
 * Implements Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4
 */
export async function requireWasherVerification(
  redirectOnFailure = true,
  fallbackPath = '/washer/dashboard'
): Promise<{
  canAccess: boolean
  status: string
  accountId?: string
  requirements?: any
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      if (redirectOnFailure) {
        redirect('/signin')
      }
      return {
        canAccess: false,
        status: 'unauthenticated',
        error: 'Authentication required'
      }
    }

    // Check washer feature access with comprehensive error handling
    const accessResult = await canAccessWasherFeatures(user.id)
    
    if (!accessResult.success) {
      console.error('Error checking washer verification status:', accessResult.error)
      
      // On error, allow access but log the issue
      return {
        canAccess: true, // Fail open for better user experience
        status: 'unknown',
        error: accessResult.error?.message || 'Failed to check verification status'
      }
    }

    const { canAccess, status, accountId, requirements } = accessResult.data!

    // If access is denied and we should redirect, redirect to main dashboard
    if (!canAccess && redirectOnFailure) {
      redirect(fallbackPath)
    }

    return {
      canAccess,
      status,
      accountId,
      requirements,
    }
  } catch (error) {
    console.error('Unexpected error in washer verification middleware:', error)
    
    // On unexpected errors, fail open but log the issue
    if (redirectOnFailure) {
      redirect(fallbackPath)
    }
    
    return {
      canAccess: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    }
  }
}

/**
 * Server component wrapper that checks verification status and provides access control
 * Note: This function is not used in tests and is kept for reference
 */
export async function withWasherVerification<T extends Record<string, any>>(
  component: React.ComponentType<T>,
  props: T,
  options: {
    redirectOnFailure?: boolean
    fallbackPath?: string
    requireComplete?: boolean
  } = {}
): Promise<boolean> {
  const {
    redirectOnFailure = true,
    fallbackPath = '/washer/dashboard',
    requireComplete = true
  } = options

  const verificationResult = await requireWasherVerification(redirectOnFailure, fallbackPath)
  
  // If we require complete verification and user doesn't have it
  if (requireComplete && verificationResult.status !== 'complete') {
    if (redirectOnFailure) {
      redirect(fallbackPath)
    }
    return false
  }

  // If access is denied
  if (!verificationResult.canAccess) {
    if (redirectOnFailure) {
      redirect(fallbackPath)
    }
    return false
  }

  return true
}

/**
 * Hook-like function for client components to check verification status
 * Note: This should be used in server components or with proper error boundaries
 */
export async function getWasherVerificationStatus(userId: string) {
  try {
    const accessResult = await canAccessWasherFeatures(userId)
    
    if (!accessResult.success) {
      return {
        canAccess: false,
        status: 'error',
        error: accessResult.error?.message || 'Failed to check verification status'
      }
    }

    return {
      canAccess: accessResult.data!.canAccess,
      status: accessResult.data!.status,
      accountId: accessResult.data!.accountId,
      requirements: accessResult.data!.requirements,
    }
  } catch (error) {
    console.error('Error getting washer verification status:', error)
    return {
      canAccess: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    }
  }
}
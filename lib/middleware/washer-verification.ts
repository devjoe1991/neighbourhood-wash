import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  canAccessWasherFeatures,
  hasCompletedOnboarding,
} from '@/lib/stripe/actions'
import type { User } from '@supabase/supabase-js'

/**
 * Middleware to check washer verification status and control access to washer-specific features
 * Updated for 4-step onboarding system
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */
export async function requireWasherVerification(
  redirectOnFailure = true,
  fallbackPath = '/washer/dashboard'
): Promise<{
  canAccess: boolean
  status: string
  accountId?: string
  requirements?: unknown
  error?: string
  user?: User
  onboardingStatus?: unknown
}> {
  try {
    // Handle build-time context where Supabase might not be available
    let supabase
    try {
      supabase = createSupabaseServerClient()
    } catch (error) {
      console.warn(
        '[WASHER_VERIFICATION] Supabase client creation failed during build:',
        error
      )
      return {
        canAccess: false,
        status: 'build_context',
        error: 'Build-time context - authentication not available',
      }
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      if (redirectOnFailure) {
        redirect('/signin')
      }
      return {
        canAccess: false,
        status: 'unauthenticated',
        error: 'Authentication required',
      }
    }

    console.log(`[WASHER_VERIFICATION] Checking access for user: ${user.id}`)

    // Check washer feature access with comprehensive 4-step onboarding validation
    const accessResult = await canAccessWasherFeatures(user.id)

    if (!accessResult.success) {
      console.error(
        '[WASHER_VERIFICATION] Error checking washer verification status:',
        accessResult.error
      )

      // On error, allow access but log the issue for monitoring
      return {
        canAccess: true, // Fail open for better user experience
        status: 'unknown',
        error:
          accessResult.error?.message || 'Failed to check verification status',
        user,
      }
    }

    const { canAccess, status, accountId, requirements, onboardingStatus } =
      accessResult.data!

    console.log(`[WASHER_VERIFICATION] Access result for user ${user.id}:`, {
      canAccess,
      status,
      onboardingComplete: onboardingStatus?.isComplete,
      completedSteps: onboardingStatus?.completedSteps,
    })

    // If access is denied and we should redirect, redirect to main dashboard
    // The main dashboard will show the onboarding flow for incomplete users
    if (!canAccess && redirectOnFailure) {
      console.log(
        `[WASHER_VERIFICATION] Access denied for user ${user.id}, redirecting to ${fallbackPath}`
      )
      redirect(fallbackPath)
    }

    return {
      canAccess,
      status,
      accountId,
      requirements,
      user,
      onboardingStatus,
    }
  } catch (error) {
    console.error(
      '[WASHER_VERIFICATION] Unexpected error in washer verification middleware:',
      error
    )

    // On unexpected errors, fail open but log the issue
    if (redirectOnFailure) {
      redirect(fallbackPath)
    }

    return {
      canAccess: false,
      status: 'error',
      error:
        error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Middleware specifically for checking 4-step onboarding completion
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */
export async function requireCompleteOnboarding(
  redirectOnFailure = true,
  fallbackPath = '/washer/dashboard'
): Promise<{
  isComplete: boolean
  completedSteps: number[]
  currentStep: number
  missingSteps: string[]
  user?: User
  error?: string
}> {
  try {
    // Handle build-time context where Supabase might not be available
    let supabase
    try {
      supabase = createSupabaseServerClient()
    } catch (error) {
      console.warn(
        '[ONBOARDING_VERIFICATION] Supabase client creation failed during build:',
        error
      )
      return {
        isComplete: false,
        completedSteps: [],
        currentStep: 1,
        missingSteps: ['Build-time context - authentication not available'],
        error: 'Build-time context',
      }
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      if (redirectOnFailure) {
        redirect('/signin')
      }
      return {
        isComplete: false,
        completedSteps: [],
        currentStep: 1,
        missingSteps: ['Authentication required'],
        error: 'Authentication required',
      }
    }

    console.log(
      `[ONBOARDING_VERIFICATION] Checking onboarding completion for user: ${user.id}`
    )

    // Check if user has completed all 4 onboarding steps
    const onboardingResult = await hasCompletedOnboarding(user.id)

    if (!onboardingResult.success) {
      console.error(
        '[ONBOARDING_VERIFICATION] Error checking onboarding completion:',
        onboardingResult.error
      )

      if (redirectOnFailure) {
        redirect(fallbackPath)
      }

      return {
        isComplete: false,
        completedSteps: [],
        currentStep: 1,
        missingSteps: ['Error checking onboarding status'],
        error:
          onboardingResult.error?.message ||
          'Failed to check onboarding status',
        user,
      }
    }

    const { isComplete, completedSteps, currentStep, missingSteps } =
      onboardingResult.data!

    console.log(
      `[ONBOARDING_VERIFICATION] Onboarding status for user ${user.id}:`,
      {
        isComplete,
        completedSteps,
        currentStep,
        missingSteps,
      }
    )

    // If onboarding is not complete and we should redirect, redirect to main dashboard
    if (!isComplete && redirectOnFailure) {
      console.log(
        `[ONBOARDING_VERIFICATION] Onboarding incomplete for user ${user.id}, redirecting to ${fallbackPath}`
      )
      redirect(fallbackPath)
    }

    return {
      isComplete,
      completedSteps,
      currentStep,
      missingSteps,
      user,
    }
  } catch (error) {
    console.error(
      '[ONBOARDING_VERIFICATION] Unexpected error checking onboarding completion:',
      error
    )

    if (redirectOnFailure) {
      redirect(fallbackPath)
    }

    return {
      isComplete: false,
      completedSteps: [],
      currentStep: 1,
      missingSteps: ['Unexpected error occurred'],
      error:
        error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Middleware for feature-specific access control with proper redirects and messaging
 * Requirements: 7.1, 7.2, 7.3, 7.4 - Add proper redirects and messaging for incomplete onboarding
 */
export async function requireFeatureAccess(
  featureName: string,
  config: {
    requireCompleteOnboarding?: boolean
    allowedSteps?: number[]
    redirectOnFailure?: boolean
    fallbackPath?: string
  } = {}
): Promise<{
  canAccess: boolean
  reason?: string
  message?: string
  onboardingStatus?: unknown
  user?: User
}> {
  const {
    requireCompleteOnboarding = true,
    allowedSteps = [],
    redirectOnFailure = true,
    fallbackPath = '/washer/dashboard',
  } = config

  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      if (redirectOnFailure) {
        redirect('/signin')
      }
      return {
        canAccess: false,
        reason: 'authentication_required',
        message: 'Please sign in to access this feature',
      }
    }

    console.log(
      `[FEATURE_ACCESS] Checking ${featureName} access for user: ${user.id}`
    )

    // Use the comprehensive access control system
    const { checkWasherFeatureAccess } = await import('@/lib/access-control')
    const accessResult = await checkWasherFeatureAccess(user.id, featureName, {
      requireCompleteOnboarding,
      allowedSteps,
      fallbackPath,
    })

    if (
      !accessResult.canAccess &&
      redirectOnFailure &&
      accessResult.redirectPath
    ) {
      console.log(
        `[FEATURE_ACCESS] Access denied for ${featureName}, redirecting to ${accessResult.redirectPath}`
      )
      redirect(accessResult.redirectPath)
    }

    return {
      canAccess: accessResult.canAccess,
      reason: accessResult.reason,
      message: accessResult.message,
      onboardingStatus: accessResult.onboardingStatus,
      user,
    }
  } catch (error) {
    console.error(
      `[FEATURE_ACCESS] Unexpected error checking ${featureName} access:`,
      error
    )

    if (redirectOnFailure) {
      redirect(fallbackPath)
    }

    return {
      canAccess: false,
      reason: 'unexpected_error',
      message: 'An unexpected error occurred while checking access',
    }
  }
}

/**
 * Server component wrapper that checks verification status and provides access control
 * Note: This function is not used in tests and is kept for reference
 */
export async function withWasherVerification<T extends Record<string, unknown>>(
  _component: React.ComponentType<T>,
  _props: T,
  options: {
    redirectOnFailure?: boolean
    fallbackPath?: string
    requireComplete?: boolean
  } = {}
): Promise<boolean> {
  const {
    redirectOnFailure = true,
    fallbackPath = '/washer/dashboard',
    requireComplete = true,
  } = options

  const verificationResult = await requireWasherVerification(
    redirectOnFailure,
    fallbackPath
  )

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
        error:
          accessResult.error?.message || 'Failed to check verification status',
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
      error:
        error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

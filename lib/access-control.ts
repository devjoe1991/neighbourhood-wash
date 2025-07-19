'use server'

import {
  hasCompletedOnboarding,
  type OnboardingStatus,
} from '@/lib/stripe/actions'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Comprehensive access control system for 4-step washer onboarding
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */

export interface AccessControlResult {
  canAccess: boolean
  reason?: string
  redirectPath?: string
  onboardingStatus?: OnboardingStatus
  missingSteps?: string[]
  currentStep?: number
  message?: string
}

export interface FeatureAccessConfig {
  requireCompleteOnboarding?: boolean
  allowedSteps?: number[] // Which onboarding steps allow access to this feature
  fallbackPath?: string
}

/**
 * Check if a washer can access a specific feature based on onboarding completion
 */
export async function checkWasherFeatureAccess(
  userId: string,
  featureName: string,
  config: FeatureAccessConfig = {}
): Promise<AccessControlResult> {
  const {
    requireCompleteOnboarding = true,
    allowedSteps = [],
    fallbackPath = '/washer/dashboard',
  } = config

  try {
    console.log(
      `[ACCESS_CONTROL] Checking ${featureName} access for user: ${userId}`
    )

    // Handle build-time context where Supabase might not be available
    let supabase
    try {
      supabase = createSupabaseServerClient()
    } catch (error) {
      console.warn(
        '[ACCESS_CONTROL] Supabase client creation failed during build:',
        error
      )
      return {
        canAccess: false,
        reason: 'build_context',
        redirectPath: fallbackPath,
        message: 'Build-time context - authentication not available',
      }
    }

    // Get user authentication and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return {
        canAccess: false,
        reason: 'authentication_required',
        redirectPath: '/signin',
        message: 'Please sign in to access this feature',
      }
    }

    // Get user profile to verify washer role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, washer_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        canAccess: false,
        reason: 'profile_not_found',
        redirectPath: '/user/dashboard',
        message: 'User profile not found',
      }
    }

    if (profile.role !== 'washer') {
      return {
        canAccess: false,
        reason: 'not_washer',
        redirectPath: '/user/dashboard',
        message: 'This feature is only available to washers',
      }
    }

    if (profile.washer_status !== 'approved') {
      return {
        canAccess: false,
        reason: 'washer_not_approved',
        redirectPath: '/user/dashboard/become-washer',
        message: 'Your washer application is not yet approved',
      }
    }

    // Check onboarding completion status
    const onboardingResult = await hasCompletedOnboarding(userId)
    if (!onboardingResult.success) {
      console.error(
        `[ACCESS_CONTROL] Error checking onboarding for ${featureName}:`,
        onboardingResult.error
      )
      return {
        canAccess: false,
        reason: 'onboarding_check_failed',
        redirectPath: fallbackPath,
        message: 'Unable to verify onboarding status',
      }
    }

    const onboardingStatus = onboardingResult.data!

    // If feature requires complete onboarding
    if (requireCompleteOnboarding) {
      if (!onboardingStatus.isComplete) {
        return {
          canAccess: false,
          reason: 'onboarding_incomplete',
          redirectPath: fallbackPath,
          onboardingStatus: onboardingStatus as OnboardingStatus,
          missingSteps: onboardingStatus.missingSteps,
          currentStep: onboardingStatus.currentStep,
          message: `Complete all 4 onboarding steps to access ${featureName}`,
        }
      }
    }

    // If feature allows access at specific onboarding steps
    if (allowedSteps.length > 0) {
      const hasRequiredStep = allowedSteps.some((step) =>
        onboardingStatus.completedSteps.includes(step)
      )

      if (!hasRequiredStep) {
        const requiredStepNames = allowedSteps
          .map((step) => getStepName(step))
          .join(', ')
        return {
          canAccess: false,
          reason: 'required_steps_incomplete',
          redirectPath: fallbackPath,
          onboardingStatus: onboardingStatus as OnboardingStatus,
          missingSteps: onboardingStatus.missingSteps,
          currentStep: onboardingStatus.currentStep,
          message: `Complete the following steps to access ${featureName}: ${requiredStepNames}`,
        }
      }
    }

    // Access granted
    console.log(
      `[ACCESS_CONTROL] Access granted to ${featureName} for user: ${userId}`
    )
    return {
      canAccess: true,
      onboardingStatus: onboardingStatus as OnboardingStatus,
    }
  } catch (error) {
    console.error(
      `[ACCESS_CONTROL] Unexpected error checking ${featureName} access:`,
      error
    )
    return {
      canAccess: false,
      reason: 'unexpected_error',
      redirectPath: fallbackPath,
      message: 'An unexpected error occurred while checking access',
    }
  }
}

/**
 * Get human-readable step names
 */
function getStepName(stepNumber: number): string {
  const stepNames = {
    1: 'Profile & Service Setup',
    2: 'Stripe Connect KYC Verification',
    3: 'Bank Account Connection',
    4: 'Onboarding Fee Payment',
  }
  return stepNames[stepNumber as keyof typeof stepNames] || `Step ${stepNumber}`
}

/**
 * Pre-configured access control functions for common features
 */

/**
 * Check access to available bookings
 * Requirements: 7.1 - Prevent access to available bookings for incomplete washers
 */
export async function checkAvailableBookingsAccess(
  userId: string
): Promise<AccessControlResult> {
  return checkWasherFeatureAccess(userId, 'Available Bookings', {
    requireCompleteOnboarding: true,
  })
}

/**
 * Check access to current bookings
 * Requirements: 7.2 - Prevent access to current bookings for incomplete washers
 */
export async function checkCurrentBookingsAccess(
  userId: string
): Promise<AccessControlResult> {
  return checkWasherFeatureAccess(userId, 'Current Bookings', {
    requireCompleteOnboarding: true,
  })
}

/**
 * Check access to payouts
 * Requirements: 7.3 - Prevent access to payouts for incomplete washers
 */
export async function checkPayoutsAccess(
  userId: string
): Promise<AccessControlResult> {
  return checkWasherFeatureAccess(userId, 'Payouts & Earnings', {
    requireCompleteOnboarding: true,
  })
}

/**
 * Check access to washer settings (available during onboarding)
 * Requirements: 6.4 - Allow settings access during onboarding
 */
export async function checkWasherSettingsAccess(
  userId: string
): Promise<AccessControlResult> {
  return checkWasherFeatureAccess(userId, 'Washer Settings', {
    requireCompleteOnboarding: false,
    allowedSteps: [1, 2, 3, 4], // Available at any step
  })
}

/**
 * Progressive feature unlocking based on step completion
 * Requirements: 6.1, 6.2, 6.3, 6.4 - Progressive feature unlocking
 */
export async function getProgressiveFeatureAccess(userId: string): Promise<{
  availableBookings: boolean
  currentBookings: boolean
  payouts: boolean
  settings: boolean
  onboardingStatus?: OnboardingStatus
}> {
  try {
    const onboardingResult = await hasCompletedOnboarding(userId)
    if (!onboardingResult.success) {
      return {
        availableBookings: false,
        currentBookings: false,
        payouts: false,
        settings: false,
      }
    }

    const status = onboardingResult.data!
    const isComplete = status.isComplete

    return {
      availableBookings: isComplete, // Requires all 4 steps
      currentBookings: isComplete, // Requires all 4 steps
      payouts: isComplete, // Requires all 4 steps
      settings: true, // Always available to washers
      onboardingStatus: status as OnboardingStatus,
    }
  } catch (error) {
    console.error(
      '[ACCESS_CONTROL] Error getting progressive feature access:',
      error
    )
    return {
      availableBookings: false,
      currentBookings: false,
      payouts: false,
      settings: false,
    }
  }
}

// Utility functions are now in lib/access-control-utils.ts to avoid Server Actions constraints

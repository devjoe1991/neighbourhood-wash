'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { OnboardingStatus } from './onboarding-service'

export interface CompletionValidationResult {
  isValid: boolean
  canComplete: boolean
  errors: string[]
  warnings: string[]
  missingRequirements: string[]
  nextSteps: string[]
}

/**
 * Comprehensive validation before completing onboarding
 */
export async function validateOnboardingCompletion(userId: string): Promise<CompletionValidationResult> {
  const supabase = createSupabaseServerClient()
  const errors: string[] = []
  const warnings: string[] = []
  const missingRequirements: string[] = []
  const nextSteps: string[] = []

  try {
    // 1. Check user profile exists and is complete
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone_number, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      errors.push('User profile not found')
      return {
        isValid: false,
        canComplete: false,
        errors,
        warnings,
        missingRequirements,
        nextSteps: ['Create user profile']
      }
    }

    if (!profile.full_name?.trim()) {
      missingRequirements.push('Full name is required')
    }

    if (!profile.phone_number?.trim()) {
      missingRequirements.push('Phone number is required')
    }

    // 2. Check washer profile exists and is properly configured
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (washerError || !washerProfile) {
      errors.push('Washer profile not found')
      missingRequirements.push('Complete washer profile setup')
      nextSteps.push('Start onboarding process')
      return {
        isValid: false,
        canComplete: false,
        errors,
        warnings,
        missingRequirements,
        nextSteps
      }
    }

    // 3. Validate onboarding status progression
    const currentStatus = washerProfile.onboarding_status as OnboardingStatus
    
    if (currentStatus !== 'payment_setup') {
      errors.push(`Cannot complete onboarding from status: ${currentStatus}`)
      
      switch (currentStatus) {
        case 'not_started':
          nextSteps.push('Complete profile setup')
          break
        case 'profile_setup':
          nextSteps.push('Complete identity verification')
          break
        case 'verification_pending':
          nextSteps.push('Wait for identity verification to complete')
          break
        case 'verification_complete':
          nextSteps.push('Connect bank account')
          break
        case 'completed':
          // Already completed
          break
        default:
          nextSteps.push('Continue onboarding process')
      }
    }

    // 4. Validate profile setup data
    if (!washerProfile.service_areas || washerProfile.service_areas.length === 0) {
      missingRequirements.push('Service area must be selected')
    }

    if (!washerProfile.service_types || washerProfile.service_types.length === 0) {
      missingRequirements.push('At least one service type must be selected')
    }

    const availabilitySchedule = washerProfile.availability_schedule as any
    if (!availabilitySchedule?.availability || availabilitySchedule.availability.length === 0) {
      missingRequirements.push('Availability schedule must be set')
    }

    // 5. Validate Stripe account setup
    if (!washerProfile.stripe_account_id) {
      missingRequirements.push('Stripe account must be created')
      nextSteps.push('Complete identity verification')
    } else {
      try {
        // Check Stripe account status
        const account = await stripe.accounts.retrieve(washerProfile.stripe_account_id)
        
        if (!account.details_submitted) {
          missingRequirements.push('Stripe identity verification must be completed')
          nextSteps.push('Complete Stripe onboarding process')
        }

        if (!account.charges_enabled) {
          warnings.push('Stripe account cannot accept charges yet')
        }

        if (!account.payouts_enabled) {
          missingRequirements.push('Stripe payouts must be enabled')
          nextSteps.push('Complete bank account connection')
        }

        // Check for external accounts (bank accounts)
        if (!account.external_accounts || account.external_accounts.data.length === 0) {
          missingRequirements.push('Bank account must be connected')
          nextSteps.push('Connect bank account for payouts')
        }

        // Check account capabilities
        if (account.capabilities?.transfers !== 'active') {
          warnings.push('Transfer capability not yet active')
        }

      } catch (stripeError) {
        console.error('Error validating Stripe account:', stripeError)
        errors.push('Failed to validate Stripe account status')
        nextSteps.push('Contact support for Stripe account issues')
      }
    }

    // 6. Check user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, status')
      .eq('user_id', userId)
      .eq('role', 'washer')
      .eq('status', 'active')
      .single()

    if (!userRoles) {
      warnings.push('Washer role not assigned - will be assigned on completion')
    }

    // 7. Validate approval status
    if (washerProfile.approval_status === 'rejected') {
      errors.push('Washer application has been rejected')
      nextSteps.push('Contact support for rejection details')
    } else if (washerProfile.approval_status === 'suspended') {
      errors.push('Washer account is suspended')
      nextSteps.push('Contact support for suspension details')
    }

    // 8. Check for any blocking issues
    const hasBlockingErrors = errors.length > 0 || missingRequirements.length > 0
    const canComplete = !hasBlockingErrors && currentStatus === 'payment_setup'

    // 9. Generate next steps if not ready to complete
    if (!canComplete && nextSteps.length === 0) {
      if (missingRequirements.length > 0) {
        nextSteps.push('Complete all missing requirements listed above')
      }
      if (currentStatus !== 'payment_setup') {
        nextSteps.push('Continue through the onboarding process')
      }
    }

    return {
      isValid: errors.length === 0,
      canComplete,
      errors,
      warnings,
      missingRequirements,
      nextSteps
    }

  } catch (error) {
    console.error('Error validating onboarding completion:', error)
    return {
      isValid: false,
      canComplete: false,
      errors: ['Failed to validate onboarding completion'],
      warnings: [],
      missingRequirements: [],
      nextSteps: ['Try again or contact support']
    }
  }
}

/**
 * Validate specific onboarding step completion
 */
export async function validateStepCompletion(
  userId: string, 
  step: OnboardingStatus
): Promise<CompletionValidationResult> {
  const supabase = createSupabaseServerClient()
  const errors: string[] = []
  const warnings: string[] = []
  const missingRequirements: string[] = []
  const nextSteps: string[] = []

  try {
    const { data: washerProfile } = await supabase
      .from('washer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!washerProfile) {
      errors.push('Washer profile not found')
      return {
        isValid: false,
        canComplete: false,
        errors,
        warnings,
        missingRequirements,
        nextSteps: ['Start onboarding process']
      }
    }

    switch (step) {
      case 'profile_setup':
        // Validate profile setup requirements
        if (!washerProfile.service_areas?.length) {
          missingRequirements.push('Service area selection')
        }
        if (!washerProfile.service_types?.length) {
          missingRequirements.push('Service type selection')
        }
        const schedule = washerProfile.availability_schedule as any
        if (!schedule?.availability?.length) {
          missingRequirements.push('Availability schedule')
        }
        break

      case 'verification_pending':
        // Validate Stripe account creation
        if (!washerProfile.stripe_account_id) {
          missingRequirements.push('Stripe account creation')
          nextSteps.push('Create Stripe Connect account')
        }
        break

      case 'verification_complete':
        // Validate Stripe verification completion
        if (!washerProfile.stripe_account_id) {
          missingRequirements.push('Stripe account')
        } else {
          try {
            const account = await stripe.accounts.retrieve(washerProfile.stripe_account_id)
            if (!account.details_submitted) {
              missingRequirements.push('Complete Stripe identity verification')
            }
          } catch (error) {
            errors.push('Failed to validate Stripe account')
          }
        }
        break

      case 'payment_setup':
        // Validate bank connection
        if (!washerProfile.stripe_account_id) {
          missingRequirements.push('Stripe account')
        } else {
          try {
            const account = await stripe.accounts.retrieve(washerProfile.stripe_account_id)
            if (!account.external_accounts?.data.length) {
              missingRequirements.push('Bank account connection')
              nextSteps.push('Connect bank account for payouts')
            }
          } catch (error) {
            errors.push('Failed to validate bank connection')
          }
        }
        break
    }

    const canComplete = errors.length === 0 && missingRequirements.length === 0

    return {
      isValid: errors.length === 0,
      canComplete,
      errors,
      warnings,
      missingRequirements,
      nextSteps
    }

  } catch (error) {
    console.error(`Error validating step ${step}:`, error)
    return {
      isValid: false,
      canComplete: false,
      errors: [`Failed to validate ${step} completion`],
      warnings: [],
      missingRequirements: [],
      nextSteps: ['Try again or contact support']
    }
  }
}

/**
 * Pre-flight check before starting onboarding
 */
export async function validateOnboardingEligibility(userId: string): Promise<CompletionValidationResult> {
  const supabase = createSupabaseServerClient()
  const errors: string[] = []
  const warnings: string[] = []
  const missingRequirements: string[] = []
  const nextSteps: string[] = []

  try {
    // Check user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, phone_number')
      .eq('id', userId)
      .single()

    if (!profile) {
      errors.push('User profile not found')
      return {
        isValid: false,
        canComplete: false,
        errors,
        warnings,
        missingRequirements,
        nextSteps: ['Create user account']
      }
    }

    if (!profile.email) {
      missingRequirements.push('Email address')
    }

    // Check for existing washer profile
    const { data: existingWasher } = await supabase
      .from('washer_profiles')
      .select('onboarding_status, approval_status')
      .eq('user_id', userId)
      .single()

    if (existingWasher) {
      if (existingWasher.onboarding_status === 'completed') {
        warnings.push('Onboarding already completed')
      } else if (existingWasher.approval_status === 'rejected') {
        errors.push('Previous washer application was rejected')
        nextSteps.push('Contact support for reapplication process')
      } else if (existingWasher.approval_status === 'suspended') {
        errors.push('Washer account is suspended')
        nextSteps.push('Contact support for account restoration')
      }
    }

    // Check for customer role conflicts
    const { data: customerRole } = await supabase
      .from('user_roles')
      .select('role, status')
      .eq('user_id', userId)
      .eq('role', 'customer')
      .eq('status', 'active')
      .single()

    if (customerRole) {
      warnings.push('User has active customer role - will have dual roles')
    }

    const canComplete = errors.length === 0 && missingRequirements.length === 0

    return {
      isValid: errors.length === 0,
      canComplete,
      errors,
      warnings,
      missingRequirements,
      nextSteps: nextSteps.length > 0 ? nextSteps : ['Begin onboarding process']
    }

  } catch (error) {
    console.error('Error validating onboarding eligibility:', error)
    return {
      isValid: false,
      canComplete: false,
      errors: ['Failed to validate eligibility'],
      warnings: [],
      missingRequirements: [],
      nextSteps: ['Try again or contact support']
    }
  }
}
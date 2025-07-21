'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { revalidatePath } from 'next/cache'

// Onboarding state machine states
export type OnboardingStatus = 
  | 'not_started'
  | 'profile_setup'
  | 'verification_pending'
  | 'verification_complete'
  | 'payment_setup'
  | 'completed'

export interface OnboardingState {
  currentStep: OnboardingStatus
  completedSteps: OnboardingStatus[]
  isComplete: boolean
  canProceed: boolean
  nextStepUrl: string
  progress: number
  profileData?: ProfileSetupData
  stripeAccountId?: string
  stripeAccountStatus?: string
  onboardingStartedAt?: string
  onboardingCompletedAt?: string
  lastStepCompletedAt?: string
}

export interface ProfileSetupData {
  firstName: string
  lastName: string
  phoneNumber: string
  serviceArea: string
  availability: string[]
  serviceTypes: string[]
  bio?: string
  preferences?: string
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}

/**
 * State machine transitions - defines valid state transitions
 */
const VALID_TRANSITIONS: Record<OnboardingStatus, OnboardingStatus[]> = {
  not_started: ['profile_setup'],
  profile_setup: ['verification_pending'],
  verification_pending: ['verification_complete'],
  verification_complete: ['payment_setup'],
  payment_setup: ['completed'],
  completed: [], // Terminal state
}

/**
 * Step URLs for navigation
 */
const STEP_URLS: Record<OnboardingStatus, string> = {
  not_started: '/washer/onboarding',
  profile_setup: '/washer/onboarding?step=1',
  verification_pending: '/washer/onboarding?step=2',
  verification_complete: '/washer/onboarding?step=3',
  payment_setup: '/washer/onboarding?step=4',
  completed: '/washer/dashboard',
}

/**
 * Calculate progress percentage based on current step
 */
function calculateProgress(currentStep: OnboardingStatus, completedSteps: OnboardingStatus[]): number {
  const allSteps: OnboardingStatus[] = ['profile_setup', 'verification_pending', 'verification_complete', 'payment_setup']
  const completedCount = completedSteps.filter(step => allSteps.includes(step)).length
  
  if (currentStep === 'completed') {
    return 100
  }
  
  return Math.round((completedCount / allSteps.length) * 100)
}

/**
 * Validate state transition
 */
function canTransitionTo(currentState: OnboardingStatus, nextState: OnboardingStatus): boolean {
  return VALID_TRANSITIONS[currentState]?.includes(nextState) || false
}

/**
 * Get the next step in the onboarding flow
 */
function getNextStep(currentStep: OnboardingStatus): OnboardingStatus | null {
  const transitions = VALID_TRANSITIONS[currentStep]
  return transitions.length > 0 ? transitions[0] : null
}

/**
 * Initialize washer onboarding - creates washer profile and starts state machine
 */
export async function startWasherOnboarding(userId: string): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Check if user already has a washer profile
    const { data: existingProfile } = await supabase
      .from('washer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (existingProfile) {
      // Return current state if profile exists
      return getOnboardingStatus(userId)
    }
    
    // Create new washer profile with initial state
    const { data: washerProfile, error: profileError } = await supabase
      .from('washer_profiles')
      .insert({
        user_id: userId,
        onboarding_status: 'not_started',
        onboarding_started_at: new Date().toISOString(),
        service_areas: [],
        service_types: [],
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Error creating washer profile:', profileError)
      return {
        success: false,
        error: {
          message: 'Failed to create washer profile',
          code: 'PROFILE_CREATION_FAILED'
        }
      }
    }
    
    // Also ensure user has washer role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'washer',
        status: 'active'
      }, {
        onConflict: 'user_id,role'
      })
    
    if (roleError) {
      console.error('Error assigning washer role:', roleError)
      // Don't fail the whole operation for role assignment
    }
    
    // Transition to first step
    const transitionResult = await transitionToStep(userId, 'profile_setup')
    if (!transitionResult.success) {
      return transitionResult
    }
    
    return getOnboardingStatus(userId)
    
  } catch (error) {
    console.error('Error starting washer onboarding:', error)
    return {
      success: false,
      error: {
        message: 'Failed to start onboarding process',
        code: 'ONBOARDING_START_FAILED'
      }
    }
  }
}

/**
 * Get current onboarding status and state
 */
export async function getOnboardingStatus(userId: string): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    const { data: washerProfile, error } = await supabase
      .from('washer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No washer profile found - user needs to start onboarding
        return {
          success: true,
          data: {
            currentStep: 'not_started',
            completedSteps: [],
            isComplete: false,
            canProceed: true,
            nextStepUrl: STEP_URLS.not_started,
            progress: 0,
          }
        }
      }
      
      console.error('Error fetching washer profile:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch onboarding status',
          code: 'STATUS_FETCH_FAILED'
        }
      }
    }
    
    const currentStep = washerProfile.onboarding_status as OnboardingStatus
    const isComplete = currentStep === 'completed'
    
    // Determine completed steps based on current step
    const completedSteps: OnboardingStatus[] = []
    const stepOrder: OnboardingStatus[] = ['profile_setup', 'verification_pending', 'verification_complete', 'payment_setup']
    
    const currentStepIndex = stepOrder.indexOf(currentStep)
    if (currentStepIndex > 0) {
      completedSteps.push(...stepOrder.slice(0, currentStepIndex))
    }
    
    if (isComplete) {
      completedSteps.push(...stepOrder)
    }
    
    const nextStep = getNextStep(currentStep)
    const canProceed = nextStep !== null || isComplete
    
    return {
      success: true,
      data: {
        currentStep,
        completedSteps,
        isComplete,
        canProceed,
        nextStepUrl: isComplete ? STEP_URLS.completed : STEP_URLS[currentStep],
        progress: calculateProgress(currentStep, completedSteps),
        stripeAccountId: washerProfile.stripe_account_id || undefined,
        stripeAccountStatus: washerProfile.stripe_account_status || undefined,
        onboardingStartedAt: washerProfile.onboarding_started_at || undefined,
        onboardingCompletedAt: washerProfile.onboarding_completed_at || undefined,
        lastStepCompletedAt: washerProfile.last_step_completed_at || undefined,
      }
    }
    
  } catch (error) {
    console.error('Error getting onboarding status:', error)
    return {
      success: false,
      error: {
        message: 'Failed to get onboarding status',
        code: 'STATUS_GET_FAILED'
      }
    }
  }
}

/**
 * Transition to a specific onboarding step
 */
export async function transitionToStep(userId: string, targetStep: OnboardingStatus): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Get current state
    const currentStateResult = await getOnboardingStatus(userId)
    if (!currentStateResult.success || !currentStateResult.data) {
      return currentStateResult
    }
    
    const currentStep = currentStateResult.data.currentStep
    
    // Validate transition
    if (!canTransitionTo(currentStep, targetStep)) {
      return {
        success: false,
        error: {
          message: `Invalid transition from ${currentStep} to ${targetStep}`,
          code: 'INVALID_TRANSITION'
        }
      }
    }
    
    // Update washer profile with new state
    const { error: updateError } = await supabase
      .from('washer_profiles')
      .update({
        onboarding_status: targetStep,
        last_step_completed_at: new Date().toISOString(),
        ...(targetStep === 'completed' && {
          onboarding_completed_at: new Date().toISOString()
        })
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('Error updating onboarding status:', updateError)
      return {
        success: false,
        error: {
          message: 'Failed to update onboarding status',
          code: 'STATUS_UPDATE_FAILED'
        }
      }
    }
    
    // Log the step transition
    await logStepTransition(userId, currentStep, targetStep)
    
    // Return updated state
    return getOnboardingStatus(userId)
    
  } catch (error) {
    console.error('Error transitioning onboarding step:', error)
    return {
      success: false,
      error: {
        message: 'Failed to transition onboarding step',
        code: 'STEP_TRANSITION_FAILED'
      }
    }
  }
}

/**
 * Complete profile setup step
 */
export async function completeProfileSetup(userId: string, profileData: ProfileSetupData): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Validate current step
    const statusResult = await getOnboardingStatus(userId)
    if (!statusResult.success || !statusResult.data) {
      return statusResult
    }
    
    if (statusResult.data.currentStep !== 'profile_setup' && statusResult.data.currentStep !== 'not_started') {
      return {
        success: false,
        error: {
          message: 'Profile setup step is not available',
          code: 'STEP_NOT_AVAILABLE'
        }
      }
    }
    
    // Update user profile with name and phone
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: `${profileData.firstName} ${profileData.lastName}`,
        phone_number: profileData.phoneNumber,
      })
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error updating user profile:', profileError)
      return {
        success: false,
        error: {
          message: 'Failed to update user profile',
          code: 'PROFILE_UPDATE_FAILED'
        }
      }
    }
    
    // Update washer profile with service details
    const { error: washerError } = await supabase
      .from('washer_profiles')
      .update({
        bio: profileData.bio,
        service_areas: [profileData.serviceArea],
        service_types: profileData.serviceTypes,
        availability_schedule: {
          availability: profileData.availability
        },
        onboarding_status: 'verification_pending',
        last_step_completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    
    if (washerError) {
      console.error('Error updating washer profile:', washerError)
      return {
        success: false,
        error: {
          message: 'Failed to update washer profile',
          code: 'WASHER_PROFILE_UPDATE_FAILED'
        }
      }
    }
    
    // Log step completion
    await logStepCompletion(userId, 'profile_setup', profileData)
    
    revalidatePath('/washer/onboarding')
    revalidatePath('/washer/dashboard')
    
    return getOnboardingStatus(userId)
    
  } catch (error) {
    console.error('Error completing profile setup:', error)
    return {
      success: false,
      error: {
        message: 'Failed to complete profile setup',
        code: 'PROFILE_SETUP_FAILED'
      }
    }
  }
}

/**
 * Start Stripe verification process
 */
export async function startStripeVerification(userId: string): Promise<ServiceResult<{ accountId: string; onboardingUrl: string }>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Validate current step
    const statusResult = await getOnboardingStatus(userId)
    if (!statusResult.success || !statusResult.data) {
      return statusResult
    }
    
    if (statusResult.data.currentStep !== 'verification_pending') {
      return {
        success: false,
        error: {
          message: 'Stripe verification step is not available',
          code: 'STEP_NOT_AVAILABLE'
        }
      }
    }
    
    // Get user email
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }
      }
    }
    
    // Check if Stripe account already exists
    const { data: washerProfile } = await supabase
      .from('washer_profiles')
      .select('stripe_account_id, stripe_account_status')
      .eq('user_id', userId)
      .single()
    
    let accountId = washerProfile?.stripe_account_id
    
    // Create Stripe account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.user.email,
        business_type: 'individual',
        country: 'GB',
      })
      
      accountId = account.id
      
      // Save account ID to database
      const { error: updateError } = await supabase
        .from('washer_profiles')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'incomplete',
        })
        .eq('user_id', userId)
      
      if (updateError) {
        console.error('Error saving Stripe account ID:', updateError)
        return {
          success: false,
          error: {
            message: 'Failed to save Stripe account',
            code: 'STRIPE_ACCOUNT_SAVE_FAILED'
          }
        }
      }
    }
    
    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/onboarding?step=2&refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/onboarding?step=2&connect_success=true`,
      type: 'account_onboarding',
    })
    
    if (!accountLink.url) {
      return {
        success: false,
        error: {
          message: 'Failed to create Stripe onboarding link',
          code: 'STRIPE_LINK_CREATION_FAILED'
        }
      }
    }
    
    // Update onboarding URL in database
    await supabase
      .from('washer_profiles')
      .update({
        stripe_onboarding_url: accountLink.url,
      })
      .eq('user_id', userId)
    
    return {
      success: true,
      data: {
        accountId,
        onboardingUrl: accountLink.url
      }
    }
    
  } catch (error) {
    console.error('Error starting Stripe verification:', error)
    return {
      success: false,
      error: {
        message: 'Failed to start Stripe verification',
        code: 'STRIPE_VERIFICATION_FAILED'
      }
    }
  }
}

/**
 * Complete Stripe verification step
 */
export async function completeStripeVerification(userId: string): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Get washer profile with Stripe account ID
    const { data: washerProfile } = await supabase
      .from('washer_profiles')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single()
    
    if (!washerProfile?.stripe_account_id) {
      return {
        success: false,
        error: {
          message: 'No Stripe account found',
          code: 'STRIPE_ACCOUNT_NOT_FOUND'
        }
      }
    }
    
    // Check Stripe account status
    const account = await stripe.accounts.retrieve(washerProfile.stripe_account_id)
    
    if (!account.details_submitted) {
      return {
        success: false,
        error: {
          message: 'Stripe verification not completed',
          code: 'STRIPE_VERIFICATION_INCOMPLETE'
        }
      }
    }
    
    // Update washer profile status
    const { error: updateError } = await supabase
      .from('washer_profiles')
      .update({
        stripe_account_status: 'complete',
        onboarding_status: 'verification_complete',
        last_step_completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('Error updating verification status:', updateError)
      return {
        success: false,
        error: {
          message: 'Failed to update verification status',
          code: 'VERIFICATION_UPDATE_FAILED'
        }
      }
    }
    
    // Log step completion
    await logStepCompletion(userId, 'verification_complete', { accountId: washerProfile.stripe_account_id })
    
    revalidatePath('/washer/onboarding')
    
    return getOnboardingStatus(userId)
    
  } catch (error) {
    console.error('Error completing Stripe verification:', error)
    return {
      success: false,
      error: {
        message: 'Failed to complete Stripe verification',
        code: 'STRIPE_VERIFICATION_COMPLETION_FAILED'
      }
    }
  }
}

/**
 * Complete payment setup step
 */
export async function completePaymentSetup(userId: string): Promise<ServiceResult<OnboardingState>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Validate current step
    const statusResult = await getOnboardingStatus(userId)
    if (!statusResult.success || !statusResult.data) {
      return statusResult
    }
    
    if (statusResult.data.currentStep !== 'payment_setup') {
      return {
        success: false,
        error: {
          message: 'Payment setup step is not available',
          code: 'STEP_NOT_AVAILABLE'
        }
      }
    }
    
    // Update washer profile to completed status
    const { error: updateError } = await supabase
      .from('washer_profiles')
      .update({
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
        last_step_completed_at: new Date().toISOString(),
        approval_status: 'approved', // Auto-approve after successful onboarding
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('Error completing onboarding:', updateError)
      return {
        success: false,
        error: {
          message: 'Failed to complete onboarding',
          code: 'ONBOARDING_COMPLETION_FAILED'
        }
      }
    }
    
    // Log step completion
    await logStepCompletion(userId, 'completed', {})
    
    revalidatePath('/washer/onboarding')
    revalidatePath('/washer/dashboard')
    
    return getOnboardingStatus(userId)
    
  } catch (error) {
    console.error('Error completing payment setup:', error)
    return {
      success: false,
      error: {
        message: 'Failed to complete payment setup',
        code: 'PAYMENT_SETUP_FAILED'
      }
    }
  }
}

/**
 * Reset onboarding progress (admin function)
 */
export async function resetOnboarding(userId: string, adminId: string): Promise<ServiceResult<void>> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Verify admin permissions
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single()
    
    if (!adminRole) {
      return {
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      }
    }
    
    // Reset washer profile onboarding status
    const { error: resetError } = await supabase
      .from('washer_profiles')
      .update({
        onboarding_status: 'not_started',
        onboarding_started_at: null,
        onboarding_completed_at: null,
        last_step_completed_at: null,
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_onboarding_url: null,
        approval_status: 'pending',
      })
      .eq('user_id', userId)
    
    if (resetError) {
      console.error('Error resetting onboarding:', resetError)
      return {
        success: false,
        error: {
          message: 'Failed to reset onboarding',
          code: 'ONBOARDING_RESET_FAILED'
        }
      }
    }
    
    // Log the reset action
    await logStepTransition(userId, 'completed', 'not_started', adminId)
    
    revalidatePath('/washer/onboarding')
    revalidatePath('/admin/washers')
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('Error resetting onboarding:', error)
    return {
      success: false,
      error: {
        message: 'Failed to reset onboarding',
        code: 'ONBOARDING_RESET_FAILED'
      }
    }
  }
}

/**
 * Log step transition for audit trail
 */
async function logStepTransition(
  userId: string, 
  fromStep: OnboardingStatus, 
  toStep: OnboardingStatus, 
  adminId?: string
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('onboarding_step_logs')
      .insert({
        user_id: userId,
        from_step: fromStep,
        to_step: toStep,
        changed_by: adminId || userId,
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Error logging step transition:', error)
    // Don't fail the main operation for logging errors
  }
}

/**
 * Log step completion for audit trail
 */
async function logStepCompletion(
  userId: string, 
  step: OnboardingStatus, 
  data: any
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('onboarding_step_logs')
      .insert({
        user_id: userId,
        to_step: step,
        step_data: data,
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Error logging step completion:', error)
    // Don't fail the main operation for logging errors
  }
}
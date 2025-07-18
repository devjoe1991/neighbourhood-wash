'use server'

import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verificationAnalytics } from '@/lib/monitoring/verification-analytics'
import {
  trackVerificationFailedAction,
  trackAccountCreatedAction,
  trackOnboardingLinkGeneratedAction,
  trackStripeRedirectAction
} from '@/lib/monitoring/verification-analytics-actions'
import { 
  withStripeApiMonitoring,
  withDatabaseMonitoring
} from '@/lib/monitoring/performance-monitor'
import { createSessionId } from '@/lib/monitoring/performance-utils'
import { 
  getOnboardingProgress,
  updateOnboardingProgress,
  logOnboardingStep,
  initializeOnboardingProgress
} from '@/lib/onboarding-progress'

const supabase = createSupabaseServerClient()

/**
 * Creates a Payment Intent for booking payments
 */
export async function createPaymentIntent(amountInPence: number) {
  console.log('🔄 Creating payment intent for amount:', amountInPence, 'pence')

  try {
    // Create Payment Intent with the amount in pence (smallest currency unit)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('✅ Payment Intent created successfully:', paymentIntent.id)
    console.log(
      '🔐 Client secret generated:',
      paymentIntent.client_secret ? 'Yes' : 'No'
    )

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
    }
  } catch (error) {
    console.error('❌ Error creating payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Creates a Stripe Checkout Session for the one-time washer onboarding fee.
 */
export async function createOnboardingFeeCheckoutSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin')
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: process.env.STRIPE_WASHER_ONBOARDING_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?payment_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?payment_cancelled=true`,
    // We use the user's ID as the client reference to identify them in the webhook
    client_reference_id: user.id,
  })

  if (!checkoutSession.url) {
    throw new Error('Could not create Stripe Checkout session')
  }

  return redirect(checkoutSession.url)
}

/**
 * Creates a new Stripe Connect account, saves the ID to the user's profile,
 * and returns a unique onboarding link.
 * Enhanced with comprehensive monitoring and analytics
 */
export async function createAndOnboardStripeConnectAccount() {
  const sessionId = createSessionId()
  const startTime = Date.now()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin')
  }

  try {
    console.log(`[STRIPE_CONNECT] Starting account creation for user: ${user.id}`)

    // 1. Create a new Stripe Connect Express account for the user with monitoring
    const account = await withStripeApiMonitoring(
      'account_create',
      () => stripe.accounts.create({
        type: 'express',
        email: user.email,
        business_type: 'individual',
        country: 'GB',
      }),
      {
        userId: user.id,
        sessionId,
        metadata: {
          email: user.email,
          business_type: 'individual',
          country: 'GB'
        }
      }
    )

    if (!account) {
      const error = new Error('Could not create Stripe Connect account')
      await trackVerificationFailedAction(user.id, undefined, sessionId, error, 'account_creation')
      throw error
    }

    console.log(`[STRIPE_CONNECT] Account created successfully: ${account.id}`)

    // Track account creation
    const accountCreationDuration = Date.now() - startTime
    await trackAccountCreatedAction(user.id, account.id, sessionId, accountCreationDuration, {
      email: user.email,
      business_type: 'individual',
      country: 'GB'
    })

    // 2. Save the new account ID to the user's profile in Supabase with monitoring
    const profileUpdateResult = await withDatabaseMonitoring(
      'profile_update_stripe_account',
      async () => await supabase
        .from('profiles')
        .update({ 
          stripe_account_id: account.id,
          stripe_account_status: 'incomplete' // Set initial status
        })
        .eq('id', user.id),
      {
        userId: user.id,
        sessionId,
        table: 'profiles',
        metadata: {
          stripe_account_id: account.id,
          operation: 'update_stripe_account_id'
        }
      }
    )

    if (profileUpdateResult.error) {
      const error = new Error('Could not save Stripe account ID to user profile.')
      await trackVerificationFailedAction(user.id, account.id, sessionId, error, 'profile_update')
      throw error
    }

    console.log(`[STRIPE_CONNECT] Profile updated with account ID: ${account.id}`)

    // 3. Create the unique, single-use onboarding link with monitoring
    const accountLink = await withStripeApiMonitoring(
      'account_link_create',
      () => stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
        type: 'account_onboarding',
      }),
      {
        userId: user.id,
        sessionId,
        accountId: account.id,
        metadata: {
          refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
          type: 'account_onboarding'
        }
      }
    )

    if (!accountLink.url) {
      const error = new Error('Could not create Stripe account link')
      await trackVerificationFailedAction(user.id, account.id, sessionId, error, 'onboarding_link_creation')
      throw error
    }

    console.log(`[STRIPE_CONNECT] Onboarding link created successfully`)

    // Track onboarding link generation
    const linkGenerationDuration = Date.now() - startTime
    await trackOnboardingLinkGeneratedAction(user.id, account.id, sessionId, linkGenerationDuration, {
      onboarding_url: accountLink.url,
      expires_at: accountLink.expires_at
    })

    // Track redirect to Stripe
    await trackStripeRedirectAction(user.id, account.id, sessionId, {
      url: accountLink.url,
      type: 'account_onboarding'
    })

    // Revalidate path to ensure profile data is fresh on the client
    revalidatePath('/user/dashboard')

    console.log(`[STRIPE_CONNECT] Redirecting user to Stripe onboarding`)

    // 4. Redirect the user to the onboarding link
    return redirect(accountLink.url)

  } catch (error) {
    console.error(`[STRIPE_CONNECT] Error in account creation flow:`, error)
    
    // Track the failure
    await trackVerificationFailedAction(
      user.id, 
      undefined, 
      sessionId, 
      error instanceof Error ? error : new Error(String(error)), 
      'account_creation_flow'
    )
    
    throw error
  }
}

/**
 * Creates a Stripe Connect Express account for the washer if they don't already have one
 * Enhanced with monitoring and analytics
 */
export async function createStripeConnectedAccount(sessionId?: string): Promise<{
  success: boolean
  accountId?: string
  message?: string
}> {
  const startTime = Date.now()
  const currentSessionId = sessionId || createSessionId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null
  
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()
    
    user = authUser

    if (authError || !user) {
      const error = new Error('Authentication error. Please log in again.')
      await trackVerificationFailedAction(user?.id || 'unknown', undefined, currentSessionId, error, 'authentication')
      return {
        success: false,
        message: error.message,
      }
    }

    // Get current user's profile with monitoring
    const profile = await withDatabaseMonitoring(
      'profile_select',
      async () => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_account_id, email, role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          throw new Error('Profile not found. Please try again.')
        }
        return profile
      },
      { userId: user.id, sessionId: currentSessionId, table: 'profiles' }
    )

    // Check if user is a washer
    if (profile.role !== 'washer') {
      const error = new Error('Only washers can connect payment accounts.')
      await trackVerificationFailedAction(user.id, undefined, currentSessionId, error, 'role_validation')
      return {
        success: false,
        message: error.message,
      }
    }

    // If they already have a Stripe account, return it
    if (profile.stripe_account_id) {
      console.log(`[ACCOUNT_CREATE] User ${user.id} already has Stripe account: ${profile.stripe_account_id}`)
      return {
        success: true,
        accountId: profile.stripe_account_id,
      }
    }

    // Create new Stripe Connect Express account with monitoring
    const account = await withStripeApiMonitoring(
      'account_create',
      async () => {
        return await stripe.accounts.create({
          type: 'express',
          email: user.email || profile.email,
          business_type: 'individual',
          country: 'GB',
        })
      },
      { userId: user.id, sessionId: currentSessionId }
    )

    // Save account ID to user's profile with monitoring
    await withDatabaseMonitoring(
      'profile_update',
      async () => {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_account_id: account.id })
          .eq('id', user.id)

        if (updateError) {
          throw new Error('Failed to save account information. Please try again.')
        }
      },
      { userId: user.id, sessionId: currentSessionId, table: 'profiles' }
    )

    const duration = Date.now() - startTime

    // Track successful account creation
    await trackAccountCreatedAction(user.id, account.id, currentSessionId, duration, {
      email: user.email || profile.email,
      business_type: 'individual',
      country: 'GB'
    })

    console.log(`[ACCOUNT_CREATE] ✅ Created Stripe account for user ${user.id}: ${account.id} (${duration}ms)`)

    return {
      success: true,
      accountId: account.id,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[ACCOUNT_CREATE] ❌ Error creating Stripe Connect account (${duration}ms):`, error)
    
    const errorInstance = error instanceof Error ? error : new Error(String(error))
    await trackVerificationFailedAction(user?.id || 'unknown', undefined, currentSessionId, errorInstance, 'account_creation')
    
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Creates a Stripe account link for onboarding
 * Enhanced with monitoring and analytics
 */
export async function createStripeAccountLink(accountId: string, sessionId?: string): Promise<{
  success: boolean
  url?: string
  message?: string
}> {
  const startTime = Date.now()
  const currentSessionId = sessionId || createSessionId()
  
  try {
    // Get current user for tracking
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'unknown'

    // Create account link with monitoring
    const accountLink = await withStripeApiMonitoring(
      'account_link_create',
      async () => {
        return await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
          type: 'account_onboarding',
        })
      },
      { userId, sessionId: currentSessionId, accountId }
    )

    const duration = Date.now() - startTime

    // Track successful link generation
    await trackOnboardingLinkGeneratedAction(userId, accountId, currentSessionId, duration, {
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
      type: 'account_onboarding'
    })

    console.log(`[ACCOUNT_LINK] ✅ Created onboarding link for account ${accountId} (${duration}ms)`)

    return {
      success: true,
      url: accountLink.url,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[ACCOUNT_LINK] ❌ Error creating Stripe account link (${duration}ms):`, error)
    
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'unknown'
    
    const errorInstance = error instanceof Error ? error : new Error(String(error))
    await trackVerificationFailedAction(userId, accountId, currentSessionId, errorInstance, 'onboarding_link_creation')
    
    return {
      success: false,
      message: 'Failed to create onboarding link. Please try again.',
    }
  }
}

// Types for Stripe account status management
export type StripeAccountStatus = 
  | 'incomplete' 
  | 'pending' 
  | 'complete' 
  | 'requires_action' 
  | 'rejected'

export interface StripeAccountDetails {
  id: string
  status: StripeAccountStatus
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
    disabled_reason?: string
  }
  capabilities?: {
    transfers?: string
    card_payments?: string
  }
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
}

// Enhanced error types for better error handling
export interface StripeError {
  type: 'stripe_error' | 'network_error' | 'validation_error' | 'auth_error' | 'unknown_error'
  code?: string
  message: string
  details?: unknown
}

export interface ServiceResponse<T = unknown> {
  success: boolean
  data?: T
  error?: StripeError
  message?: string
}

/**
 * Helper function to create standardized error responses
 */
function createStripeError(error: unknown): StripeError {
  if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeError') {
    const stripeError = error as { type: string; code?: string; message: string; param?: string; decline_code?: string }
    return {
      type: 'stripe_error',
      code: stripeError.code,
      message: stripeError.message,
      details: {
        type: stripeError.type,
        param: stripeError.param,
        decline_code: stripeError.decline_code,
      },
    }
  }

  if (error && typeof error === 'object' && 'code' in error && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
    const networkError = error as { code: string }
    return {
      type: 'network_error',
      message: 'Network connection error. Please check your internet connection.',
      details: { code: networkError.code },
    }
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Invalid API key')) {
    return {
      type: 'auth_error',
      message: 'Authentication error with payment provider',
      details: error.message,
    }
  }

  return {
    type: 'unknown_error',
    message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
      ? error.message 
      : 'An unexpected error occurred',
    details: error,
  }
}

/**
 * Gets the current Stripe account status from Stripe API with comprehensive error handling
 */
export async function getStripeAccountStatus(accountId: string): Promise<ServiceResponse<StripeAccountDetails>> {
  try {
    // Input validation
    if (!accountId || typeof accountId !== 'string' || accountId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid Stripe account ID is required',
        },
      }
    }

    // Validate account ID format (Stripe Connect accounts start with 'acct_')
    if (!accountId.startsWith('acct_')) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Invalid Stripe account ID format',
        },
      }
    }

    console.log(`Retrieving Stripe account status for: ${accountId}`)

    const account = await stripe.accounts.retrieve(accountId)

    // Determine status based on Stripe account properties with enhanced logic
    let status: StripeAccountStatus = 'incomplete'
    
    if (account.details_submitted) {
      // Check if account is fully functional
      if (account.charges_enabled && account.payouts_enabled) {
        // Double-check no outstanding requirements
        const hasOutstandingRequirements = 
          (account.requirements?.currently_due?.length || 0) > 0 ||
          (account.requirements?.past_due?.length || 0) > 0

        status = hasOutstandingRequirements ? 'requires_action' : 'complete'
      } else if (account.requirements?.disabled_reason) {
        // Account has been rejected or disabled
        status = 'rejected'
      } else if (
        (account.requirements?.currently_due?.length || 0) > 0 ||
        (account.requirements?.past_due?.length || 0) > 0
      ) {
        // Action required from user
        status = 'requires_action'
      } else if ((account.requirements?.pending_verification?.length || 0) > 0) {
        // Waiting for Stripe to verify submitted information
        status = 'pending'
      } else {
        // Details submitted but still processing
        status = 'pending'
      }
    }

    const accountDetails: StripeAccountDetails = {
      id: account.id,
      status,
      requirements: account.requirements ? {
        currently_due: account.requirements.currently_due || [],
        eventually_due: account.requirements.eventually_due || [],
        past_due: account.requirements.past_due || [],
        pending_verification: account.requirements.pending_verification || [],
        disabled_reason: account.requirements.disabled_reason || undefined,
      } : undefined,
      capabilities: {
        transfers: account.capabilities?.transfers,
        card_payments: account.capabilities?.card_payments,
      },
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    }

    console.log(`Account status retrieved successfully: ${status}`)

    return {
      success: true,
      data: accountDetails,
    }
  } catch (error) {
    console.error('Error retrieving Stripe account status:', error)
    
    const stripeError = createStripeError(error)
    
    // Handle specific error cases
    if (stripeError.type === 'stripe_error' && stripeError.code === 'account_invalid') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Stripe account not found or invalid',
        },
      }
    }

    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Checks if a washer can access core features based on verification status with comprehensive error handling
 */
// Types for profile setup data
export interface ProfileSetupData {
  firstName: string
  lastName: string
  serviceArea: string
  availability: string[]
  bio: string
  phoneNumber: string
}

// Types for onboarding status
export interface OnboardingStatus {
  currentStep: number
  completedSteps: number[]
  isComplete: boolean
  profileData?: ProfileSetupData
  stripeAccountId?: string
  bankConnected?: boolean
  paymentCompleted?: boolean
}

/**
 * Gets the current onboarding status for a washer
 * Enhanced with progress tracking integration
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function getOnboardingStatus(userId: string): Promise<ServiceResponse<OnboardingStatus>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_STATUS] Checking onboarding status for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Get user's profile and washer application data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, role, onboarding_fee_paid, phone_number')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to retrieve user profile',
          details: profileError,
        },
      }
    }

    // Only washers need onboarding
    if (profile.role !== 'washer') {
      return {
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [1, 2, 3, 4],
          isComplete: true,
        },
      }
    }

    // First, try to get progress from the new tracking system
    const progressResult = await getOnboardingProgress(userId)
    if (progressResult.success && progressResult.data) {
      const progressData = progressResult.data
      
      // Convert progress data to OnboardingStatus format
      const status: OnboardingStatus = {
        currentStep: progressData.currentStep,
        completedSteps: progressData.completedSteps,
        isComplete: progressData.isComplete,
        profileData: progressData.stepData.profileSetup,
        stripeAccountId: profile.stripe_account_id || undefined,
        bankConnected: progressData.completedSteps.includes(3),
        paymentCompleted: progressData.completedSteps.includes(4),
      }

      console.log(`[ONBOARDING_STATUS] Status from progress tracking for user ${userId}:`, status)
      return {
        success: true,
        data: status,
      }
    }

    // Fallback to legacy logic if progress tracking is not available
    console.log(`[ONBOARDING_STATUS] Using legacy status check for user: ${userId}`)

    // Get washer application data for profile setup
    const { data: washerApp, error: _appError } = await supabase
      .from('washer_applications')
      .select('phone_number, service_address, service_offerings, washer_bio, equipment_details')
      .eq('user_id', userId)
      .single()

    // Determine completed steps
    const completedSteps: number[] = []
    let currentStep = 1

    // Step 1: Profile Setup - check if washer application exists with required data
    if (washerApp && washerApp.phone_number && washerApp.service_address && 
        washerApp.service_offerings?.length > 0 && washerApp.washer_bio) {
      completedSteps.push(1)
      currentStep = 2
    }

    // Step 2: Stripe KYC - check if account exists and is verified
    if (profile.stripe_account_id) {
      // Get the actual Stripe account status
      const accountStatusResult = await getStripeAccountStatus(profile.stripe_account_id)
      if (accountStatusResult.success && accountStatusResult.data) {
        const accountStatus = accountStatusResult.data.status
        
        // Update the profile with the latest status if it's different
        if (accountStatus !== profile.stripe_account_status) {
          try {
            await supabase
              .from('profiles')
              .update({ stripe_account_status: accountStatus })
              .eq('id', userId)
          } catch (updateError) {
            console.warn('Failed to update stripe account status:', updateError)
          }
        }
        
        // Check if KYC is complete
        if (accountStatus === 'complete') {
          completedSteps.push(2)
          currentStep = 3
        } else {
          // Account exists but not complete, stay on step 2
          currentStep = 2
        }
      } else {
        // Failed to get account status, stay on step 2
        currentStep = 2
      }
    }

    // Step 3: Bank Connection - check if bank account is connected
    if (completedSteps.includes(2) && profile.stripe_account_id) {
      // Check if bank account is connected
      const bankStatusResult = await checkBankConnectionStatus(profile.stripe_account_id)
      if (bankStatusResult.success && bankStatusResult.data?.bankConnected) {
        completedSteps.push(3)
        currentStep = 4
      } else {
        currentStep = 3
      }
    }

    // Step 4: Payment - check if onboarding fee is paid
    if (profile.onboarding_fee_paid) {
      completedSteps.push(4)
    }

    const isComplete = completedSteps.length === 4

    // Prepare profile data if available
    let profileData: ProfileSetupData | undefined
    if (washerApp) {
      profileData = {
        serviceArea: washerApp.service_address || '',
        availability: [], // This would need to be stored separately or parsed from equipment_details
        serviceTypes: washerApp.service_offerings || [],
        preferences: washerApp.equipment_details || '',
        bio: washerApp.washer_bio || '',
        phoneNumber: washerApp.phone_number || profile.phone_number || '',
      }
    }

    const status: OnboardingStatus = {
      currentStep: isComplete ? 4 : currentStep,
      completedSteps,
      isComplete,
      profileData,
      stripeAccountId: profile.stripe_account_id || undefined,
      bankConnected: completedSteps.includes(3),
      paymentCompleted: profile.onboarding_fee_paid || false,
    }

    // Initialize progress tracking for this user with current status
    try {
      await initializeOnboardingProgress(userId)
      
      // Update progress tracking with current status
      for (const step of completedSteps) {
        await updateOnboardingProgress(userId, step, 
          step === 1 ? profileData : undefined
        )
      }
    } catch (progressError) {
      console.warn('[ONBOARDING_STATUS] Failed to initialize progress tracking:', progressError)
    }

    console.log(`[ONBOARDING_STATUS] Legacy status for user ${userId}:`, status)

    return {
      success: true,
      data: status,
    }
  } catch (error) {
    console.error('[ONBOARDING_STATUS] Error checking onboarding status:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Handles Step 2: Embedded KYC data submission
 * Collects KYC data through our form and submits to Stripe
 */
export async function submitEmbeddedKYC(userId: string, kycData: {
  dateOfBirth: string
  address: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  idDocument: File | null
  lastFourSSN: string
}): Promise<ServiceResponse<{ accountId: string }>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[EMBEDDED_KYC] Processing KYC for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, role, email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'User profile not found',
          details: profileError,
        },
      }
    }

    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Only washers can complete KYC verification',
        },
      }
    }

    let accountId = profile.stripe_account_id

    // Create Stripe account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email,
        business_type: 'individual',
        country: 'GB',
      })
      accountId = account.id

      // Save account ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', userId)
    }

    // Parse name from full_name
    const nameParts = (profile.full_name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Submit KYC data to Stripe
    await stripe.accounts.update(accountId, {
      individual: {
        first_name: firstName,
        last_name: lastName,
        dob: {
          day: parseInt(kycData.dateOfBirth.split('-')[2]),
          month: parseInt(kycData.dateOfBirth.split('-')[1]),
          year: parseInt(kycData.dateOfBirth.split('-')[0]),
        },
        address: {
          line1: kycData.address.line1,
          city: kycData.address.city,
          postal_code: kycData.address.postalCode,
          country: kycData.address.country,
        },
        id_number: kycData.lastFourSSN, // Last 4 of National Insurance
        email: profile.email,
      },
      business_type: 'individual',
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1', // This should be the user's actual IP in production
      },
    })

    // Update profile status
    await supabase
      .from('profiles')
      .update({ 
        stripe_account_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Update onboarding progress
    const progressResult = await updateOnboardingProgress(userId, 2, { accountId })
    if (!progressResult.success) {
      console.warn('[EMBEDDED_KYC] Failed to update progress tracking:', progressResult.error)
    }

    // Log the step completion
    await logOnboardingStep(userId, 2, 'completed', 'success', { accountId })

    console.log(`[EMBEDDED_KYC] ✅ KYC submitted for user ${userId} with account ${accountId}`)

    return {
      success: true,
      data: { accountId },
      message: 'KYC verification submitted successfully',
    }
  } catch (error) {
    console.error('[EMBEDDED_KYC] Error submitting KYC:', error)
    
    // Log the error
    await logOnboardingStep(userId, 2, 'failed', 'error', null, { error: error instanceof Error ? error.message : String(error) })
    
    const stripeError = createStripeError(error)
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use submitEmbeddedKYC instead
 */
export async function initiateStripeKYC(_userId: string): Promise<ServiceResponse<{ accountId: string; onboardingUrl: string }>> {
  // For now, return an error to force use of the new embedded flow
  return {
    success: false,
    error: {
      type: 'unknown_error',
      message: 'Please use the embedded KYC form instead',
    },
  }
}

/**
 * Save profile setup data (Step 1)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export async function saveProfileSetup(userId: string, profileData: ProfileSetupData): Promise<ServiceResponse<void>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[PROFILE_SETUP] Saving profile setup for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Update profile with name information
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim()
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: profileData.phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('[PROFILE_SETUP] Error updating profile:', profileError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to update profile information',
          details: profileError,
        },
      }
    }

    // Save or update washer application data
    const { error: upsertError } = await supabase
      .from('washer_applications')
      .upsert({
        user_id: userId,
        profile_id: userId, // Required field - use user_id as profile_id
        phone_number: profileData.phoneNumber,
        service_address: profileData.serviceArea,
        service_offerings: [], // All washers provide all services
        washer_bio: profileData.bio || '', // Ensure it's not null
        equipment_details: '', // No longer collecting equipment details
        updated_at: new Date().toISOString(),
      })

    // Update profiles table with washer-specific settings for admin filtering
    const { error: settingsError } = await supabase
      .from('profiles')
      .update({
        service_offerings: [], // All washers provide all services
        availability_schedule: {
          availability: profileData.availability,
          serviceArea: profileData.serviceArea,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (upsertError) {
      console.error('[PROFILE_SETUP] Error saving washer application data:', upsertError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to save washer application data',
          details: upsertError,
        },
      }
    }

    if (settingsError) {
      console.error('[PROFILE_SETUP] Error updating profile settings:', settingsError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to update profile settings for admin filtering',
          details: settingsError,
        },
      }
    }

    // Update onboarding progress
    const progressResult = await updateOnboardingProgress(userId, 1, profileData)
    if (!progressResult.success) {
      console.warn('[PROFILE_SETUP] Failed to update progress tracking:', progressResult.error)
    }

    // Log the step completion
    await logOnboardingStep(userId, 1, 'completed', 'success', profileData)

    console.log(`[PROFILE_SETUP] ✅ Profile setup completed for user: ${userId}`)

    return {
      success: true,
      message: 'Profile setup saved successfully',
    }
  } catch (error) {
    console.error('[PROFILE_SETUP] Error saving profile setup:', error)
    
    // Log the error
    await logOnboardingStep(userId, 1, 'failed', 'error', null, { error: error instanceof Error ? error.message : String(error) })
    
    const stripeError = createStripeError(error)
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Updates onboarding progress when KYC is completed
 * This is called by the callback handler when Stripe redirects back
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function updateKYCProgress(userId: string, accountId: string): Promise<ServiceResponse<{ step: number }>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[KYC_PROGRESS] Updating KYC progress for user: ${userId}, account: ${accountId}`)

    // Check the actual Stripe account status
    const statusResult = await getStripeAccountStatus(accountId)
    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to verify KYC status with Stripe',
          details: statusResult.error,
        },
      }
    }

    const accountStatus = statusResult.data.status

    // Update profile with latest status
    const supabase = createSupabaseServerClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_account_status: accountStatus })
      .eq('id', userId)

    if (updateError) {
      console.warn('[KYC_PROGRESS] Failed to update profile status:', updateError)
    }

    // If KYC is complete, update progress tracking
    if (accountStatus === 'complete') {
      const progressResult = await updateOnboardingProgress(userId, 2, { accountId, status: accountStatus })
      if (!progressResult.success) {
        console.warn('[KYC_PROGRESS] Failed to update progress tracking:', progressResult.error)
      }

      // Log the step completion
      await logOnboardingStep(userId, 2, 'completed', 'success', { accountId, status: accountStatus })

      console.log(`[KYC_PROGRESS] ✅ KYC completed for user: ${userId}`)

      return {
        success: true,
        data: { step: 2 },
        message: 'KYC verification completed successfully',
      }
    } else {
      // Log the status check
      await logOnboardingStep(userId, 2, 'status_check', 'pending', { accountId, status: accountStatus })

      return {
        success: true,
        data: { step: 2 },
        message: `KYC status: ${accountStatus}. Please complete any remaining requirements.`,
      }
    }
  } catch (error) {
    console.error('[KYC_PROGRESS] Error updating KYC progress:', error)
    
    // Log the error
    await logOnboardingStep(userId, 2, 'failed', 'error', null, { error: error instanceof Error ? error.message : String(error) })
    
    const stripeError = createStripeError(error)
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Updates onboarding progress when bank account is connected (Step 3)
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export async function updateBankConnectionProgress(userId: string, accountId: string): Promise<ServiceResponse<{ step: number }>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[BANK_CONNECTION] Updating bank connection progress for user: ${userId}, account: ${accountId}`)

    // Check bank connection status
    const bankStatusResult = await checkBankConnectionStatus(accountId)
    if (!bankStatusResult.success || !bankStatusResult.data) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to verify bank connection status',
          details: bankStatusResult.error,
        },
      }
    }

    const { bankConnected } = bankStatusResult.data

    if (bankConnected) {
      // Update progress tracking
      const progressResult = await updateOnboardingProgress(userId, 3, { accountId, bankConnected: true })
      if (!progressResult.success) {
        console.warn('[BANK_CONNECTION] Failed to update progress tracking:', progressResult.error)
      }

      // Log the step completion
      await logOnboardingStep(userId, 3, 'completed', 'success', { accountId, bankConnected: true })

      console.log(`[BANK_CONNECTION] ✅ Bank connection completed for user: ${userId}`)

      return {
        success: true,
        data: { step: 3 },
        message: 'Bank account connected successfully',
      }
    } else {
      // Log the status check
      await logOnboardingStep(userId, 3, 'status_check', 'pending', { accountId, bankConnected: false })

      return {
        success: true,
        data: { step: 3 },
        message: 'Bank account connection is still pending verification',
      }
    }
  } catch (error) {
    console.error('[BANK_CONNECTION] Error updating bank connection progress:', error)
    
    // Log the error
    await logOnboardingStep(userId, 3, 'failed', 'error', null, { error: error instanceof Error ? error.message : String(error) })
    
    const stripeError = createStripeError(error)
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Complete onboarding and unlock features (called after payment confirmation)
 * Requirements: 5.4, 5.5, 6.1, 6.2, 6.3, 6.4
 */
export async function completeOnboarding(userId: string, paymentIntentId?: string): Promise<ServiceResponse<void>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[COMPLETE_ONBOARDING] Completing onboarding for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Mark onboarding fee as paid
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_fee_paid: true })
      .eq('id', userId)

    if (updateError) {
      console.error('[COMPLETE_ONBOARDING] Error updating payment status:', updateError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to update payment status',
          details: updateError,
        },
      }
    }

    // Update progress tracking
    const progressResult = await updateOnboardingProgress(userId, 4, { 
      paymentCompleted: true, 
      paymentIntentId 
    })
    if (!progressResult.success) {
      console.warn('[COMPLETE_ONBOARDING] Failed to update progress tracking:', progressResult.error)
    }

    // Log the completion
    await logOnboardingStep(userId, 4, 'completed', 'success', { 
      paymentCompleted: true, 
      paymentIntentId,
      completedAt: new Date().toISOString()
    })

    console.log(`[COMPLETE_ONBOARDING] ✅ Onboarding completed for user: ${userId}`)

    // Revalidate relevant paths
    revalidatePath('/washer/dashboard')

    return {
      success: true,
      message: 'Onboarding completed successfully! All features are now unlocked.',
    }
  } catch (error) {
    console.error('[COMPLETE_ONBOARDING] Error completing onboarding:', error)
    
    // Log the error
    await logOnboardingStep(userId, 4, 'completion_failed', 'error', null, { error: error instanceof Error ? error.message : String(error) })
    
    const stripeError = createStripeError(error)
    return {
      success: false,
      error: stripeError,
    }
  }
}



/**
 * Handles Step 3: Bank account connection to Stripe
 * Creates external account link for bank account connection
 */
export async function initiateBankConnection(userId: string): Promise<ServiceResponse<{ accountId: string; bankConnectionUrl: string }>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[BANK_CONNECTION] Initiating bank connection for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Get user's profile to check if they have a Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, role, stripe_account_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'User profile not found',
          details: profileError,
        },
      }
    }

    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Only washers can connect bank accounts',
        },
      }
    }

    if (!profile.stripe_account_id) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Stripe account required before connecting bank account',
        },
      }
    }

    // Check if KYC is complete before allowing bank connection
    if (profile.stripe_account_status !== 'complete') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'KYC verification must be complete before connecting bank account',
        },
      }
    }

    // Create account link for bank account connection
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?bank_connection=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?bank_connection=complete`,
      type: 'account_update',
    })

    if (!accountLink.url) {
      return {
        success: false,
        error: {
          type: 'stripe_error',
          message: 'Failed to create bank connection link',
        },
      }
    }

    console.log(`[BANK_CONNECTION] ✅ Bank connection link created for user ${userId}`)

    return {
      success: true,
      data: {
        accountId: profile.stripe_account_id,
        bankConnectionUrl: accountLink.url,
      },
      message: 'Bank connection link created successfully',
    }
  } catch (error) {
    console.error('[BANK_CONNECTION] Error initiating bank connection:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Checks if bank account is connected to Stripe account
 */
export async function checkBankConnectionStatus(accountId: string): Promise<ServiceResponse<{ bankConnected: boolean; bankDetails?: Record<string, unknown> }>> {
  try {
    if (!accountId || typeof accountId !== 'string' || accountId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid account ID is required',
        },
      }
    }

    console.log(`[BANK_STATUS] Checking bank connection status for account: ${accountId}`)

    // Get account details from Stripe
    const _account = await stripe.accounts.retrieve(accountId)

    // Check if external accounts (bank accounts) are connected
    const externalAccounts = await stripe.accounts.listExternalAccounts(accountId, {
      object: 'bank_account',
      limit: 10,
    })

    const bankConnected = externalAccounts.data.length > 0
    const bankDetails = bankConnected ? {
      count: externalAccounts.data.length,
      accounts: externalAccounts.data.map(account => ({
        id: account.id,
        last4: account.last4,
        bank_name: account.object === 'bank_account' ? (account as { bank_name?: string }).bank_name : undefined,
        status: account.status,
      }))
    } : undefined

    console.log(`[BANK_STATUS] Bank connection status for ${accountId}: ${bankConnected ? 'connected' : 'not connected'}`)

    return {
      success: true,
      data: {
        bankConnected,
        bankDetails,
      },
    }
  } catch (error) {
    console.error('[BANK_STATUS] Error checking bank connection status:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}





export async function canAccessWasherFeatures(userId: string): Promise<ServiceResponse<{
  canAccess: boolean
  status: StripeAccountStatus
  accountId?: string
  requirements?: StripeAccountDetails['requirements']
  onboardingStatus?: OnboardingStatus
}>> {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ACCESS_CONTROL] Checking washer feature access for user: ${userId}`)

    // Get user's profile with Stripe account information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, role, onboarding_fee_paid')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Database error fetching profile:', profileError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to retrieve user profile',
          details: profileError,
        },
      }
    }

    if (!profile) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'User profile not found',
        },
      }
    }

    // Only washers need verification
    if (profile.role !== 'washer') {
      console.log(`[ACCESS_CONTROL] User ${userId} is not a washer, granting full access`)
      return {
        success: true,
        data: {
          canAccess: true,
          status: 'complete',
        },
      }
    }

    // Get comprehensive onboarding status for 4-step verification
    const onboardingResult = await getOnboardingStatus(userId)
    if (!onboardingResult.success) {
      console.error('[ACCESS_CONTROL] Failed to get onboarding status:', onboardingResult.error)
      // Fall back to basic Stripe verification for backward compatibility
      return await checkBasicStripeVerification(userId, profile)
    }

    const onboardingStatus = onboardingResult.data!
    console.log(`[ACCESS_CONTROL] Onboarding status for user ${userId}:`, {
      currentStep: onboardingStatus.currentStep,
      completedSteps: onboardingStatus.completedSteps,
      isComplete: onboardingStatus.isComplete
    })

    // For 4-step onboarding, user must complete ALL steps to access features
    const canAccess = onboardingStatus.isComplete && onboardingStatus.completedSteps.length === 4

    // Determine the overall status based on onboarding progress
    let overallStatus: StripeAccountStatus = 'incomplete'
    if (onboardingStatus.isComplete) {
      overallStatus = 'complete'
    } else if (onboardingStatus.completedSteps.includes(2)) {
      // If Stripe KYC is done, check the actual Stripe status
      if (profile.stripe_account_id) {
        const statusResult = await getStripeAccountStatus(profile.stripe_account_id)
        if (statusResult.success && statusResult.data) {
          overallStatus = statusResult.data.status
        } else {
          overallStatus = (profile.stripe_account_status as StripeAccountStatus) || 'pending'
        }
      } else {
        overallStatus = 'pending'
      }
    } else if (onboardingStatus.completedSteps.length > 0) {
      overallStatus = 'pending'
    }

    console.log(`[ACCESS_CONTROL] Access decision for user ${userId}: ${canAccess ? 'GRANTED' : 'DENIED'} (status: ${overallStatus})`)

    return {
      success: true,
      data: {
        canAccess,
        status: overallStatus,
        accountId: profile.stripe_account_id,
        onboardingStatus,
      },
    }
  } catch (error) {
    console.error('[ACCESS_CONTROL] Error checking washer feature access:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Checks if a washer has completed all 4 onboarding steps
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */
export async function hasCompletedOnboarding(userId: string): Promise<ServiceResponse<{
  isComplete: boolean
  completedSteps: number[]
  currentStep: number
  missingSteps: string[]
}>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_CHECK] Checking onboarding completion for user: ${userId}`)

    const onboardingResult = await getOnboardingStatus(userId)
    if (!onboardingResult.success) {
      return {
        success: false,
        error: onboardingResult.error,
      }
    }

    const status = onboardingResult.data!
    const missingSteps: string[] = []

    // Check each step and identify what's missing
    if (!status.completedSteps.includes(1)) {
      missingSteps.push('Profile & Service Setup')
    }
    if (!status.completedSteps.includes(2)) {
      missingSteps.push('Stripe Connect KYC Verification')
    }
    if (!status.completedSteps.includes(3)) {
      missingSteps.push('Bank Account Connection')
    }
    if (!status.completedSteps.includes(4)) {
      missingSteps.push('Onboarding Fee Payment')
    }

    console.log(`[ONBOARDING_CHECK] User ${userId} completion status:`, {
      isComplete: status.isComplete,
      completedSteps: status.completedSteps,
      missingSteps
    })

    return {
      success: true,
      data: {
        isComplete: status.isComplete,
        completedSteps: status.completedSteps,
        currentStep: status.currentStep,
        missingSteps,
      },
    }
  } catch (error) {
    console.error('[ONBOARDING_CHECK] Error checking onboarding completion:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Fallback function for basic Stripe verification (backward compatibility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkBasicStripeVerification(userId: string, profile: any): Promise<ServiceResponse<{
  canAccess: boolean
  status: StripeAccountStatus
  accountId?: string
  requirements?: StripeAccountDetails['requirements']
}>> {
  try {
    console.log(`[ACCESS_CONTROL] Using fallback basic Stripe verification for user: ${userId}`)

    // If no Stripe account, they can't access features
    if (!profile.stripe_account_id) {
      console.log(`[ACCESS_CONTROL] User ${userId} has no Stripe account, access denied`)
      return {
        success: true,
        data: {
          canAccess: false,
          status: 'incomplete',
        },
      }
    }

    // Check current status from Stripe API with retry logic
    const statusResult = await getStripeAccountStatus(profile.stripe_account_id)
    
    if (!statusResult.success) {
      console.warn('[ACCESS_CONTROL] Failed to get current Stripe status, falling back to cached status')
      
      // Fall back to cached status if API call fails
      const cachedStatus = (profile.stripe_account_status as StripeAccountStatus) || 'incomplete'
      return {
        success: true,
        data: {
          canAccess: cachedStatus === 'complete',
          status: cachedStatus,
          accountId: profile.stripe_account_id,
        },
        message: 'Using cached verification status due to API error',
      }
    }

    const accountDetails = statusResult.data!
    const currentStatus = accountDetails.status

    // Update cached status if it's different (with error handling)
    if (currentStatus !== profile.stripe_account_status) {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_account_status: currentStatus })
          .eq('id', userId)

        if (updateError) {
          console.error('[ACCESS_CONTROL] Failed to update cached status:', updateError)
          // Continue execution - this is not a critical failure
        } else {
          console.log(`[ACCESS_CONTROL] Updated cached status for user ${userId}: ${profile.stripe_account_status} -> ${currentStatus}`)
        }
      } catch (updateError) {
        console.error('[ACCESS_CONTROL] Exception updating cached status:', updateError)
        // Continue execution - this is not a critical failure
      }
    }

    // Only 'complete' status allows full access
    const canAccess = currentStatus === 'complete'

    console.log(`[ACCESS_CONTROL] Access check result for user ${userId}: ${canAccess ? 'granted' : 'denied'} (status: ${currentStatus})`)

    return {
      success: true,
      data: {
        canAccess,
        status: currentStatus,
        accountId: profile.stripe_account_id,
        requirements: accountDetails.requirements,
      },
    }
  } catch (error) {
    console.error('[ACCESS_CONTROL] Error checking washer feature access:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Logs verification events for audit purposes (Requirement 6.2)
 * Now uses the enhanced verification analytics system
 */
async function logVerificationEvent(
  userId: string,
  accountId: string,
  eventType: 'callback_processed' | 'status_updated' | 'verification_completed' | 'verification_failed',
  details: {
    previousStatus?: StripeAccountStatus
    currentStatus: StripeAccountStatus
    statusChanged: boolean
    error?: string
    requirements?: Record<string, unknown>
  },
  sessionId?: string
): Promise<void> {
  try {
    // Use the new analytics system for comprehensive tracking
    await verificationAnalytics.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event_type: eventType as any,
      event_data: {
        previous_status: details.previousStatus,
        current_status: details.currentStatus,
        status_changed: details.statusChanged,
        requirements: details.requirements,
        error_message: details.error
      },
      session_id: sessionId,
      error_details: details.error ? {
        type: 'verification_error',
        message: details.error
      } : undefined
    })
  } catch (error) {
    console.error('Failed to log verification event:', error)
    // Don't throw - logging failures shouldn't break the main flow
  }
}

/**
 * Handles verification completion callbacks and updates profile status with comprehensive error handling
 * Implements Requirements 2.4, 2.5, 6.1, 6.2
 */
export async function handleVerificationCallback(
  userId: string,
  accountId?: string
): Promise<ServiceResponse<{
  status: StripeAccountStatus
  previousStatus?: StripeAccountStatus
  accountId: string
  statusChanged: boolean
}>> {
  const startTime = Date.now()
  
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      const error = {
        type: 'validation_error' as const,
        message: 'Valid user ID is required',
      }
      
      await logVerificationEvent(userId || 'unknown', accountId || 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: error.message,
      })
      
      return { success: false, error }
    }

    if (accountId && (!accountId.startsWith('acct_') || accountId.trim().length === 0)) {
      const error = {
        type: 'validation_error' as const,
        message: 'Invalid Stripe account ID format',
      }
      
      await logVerificationEvent(userId, accountId || 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: error.message,
      })
      
      return { success: false, error }
    }

    console.log(`[VERIFICATION_CALLBACK] Processing verification callback for user: ${userId}${accountId ? `, account: ${accountId}` : ''}`)

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, role, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[VERIFICATION_CALLBACK] Database error fetching profile:', profileError)
      
      const error = {
        type: 'unknown_error' as const,
        message: 'Failed to retrieve user profile',
        details: profileError,
      }
      
      await logVerificationEvent(userId, accountId || 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: `Database error: ${profileError.message}`,
      })
      
      return { success: false, error }
    }

    if (!profile) {
      const error = {
        type: 'validation_error' as const,
        message: 'User profile not found',
      }
      
      await logVerificationEvent(userId, accountId || 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: error.message,
      })
      
      return { success: false, error }
    }

    // Only process callbacks for washers
    if (profile.role !== 'washer') {
      const error = {
        type: 'validation_error' as const,
        message: 'Verification callbacks only apply to washers',
      }
      
      await logVerificationEvent(userId, accountId || 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: error.message,
      })
      
      return { success: false, error }
    }

    // Use provided accountId or fall back to profile's account ID
    const stripeAccountId = accountId || profile.stripe_account_id

    if (!stripeAccountId) {
      const error = {
        type: 'validation_error' as const,
        message: 'No Stripe account found for user',
      }
      
      await logVerificationEvent(userId, 'unknown', 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: error.message,
      })
      
      return { success: false, error }
    }

    // Get current status from Stripe with retry logic
    console.log(`[VERIFICATION_CALLBACK] Fetching current status from Stripe for account: ${stripeAccountId}`)
    const statusResult = await getStripeAccountStatus(stripeAccountId)

    if (!statusResult.success) {
      console.error('[VERIFICATION_CALLBACK] Failed to retrieve account status:', statusResult.error)
      
      await logVerificationEvent(userId, stripeAccountId, 'verification_failed', {
        currentStatus: 'incomplete',
        statusChanged: false,
        error: `Stripe API error: ${statusResult.error?.message}`,
      })
      
      return {
        success: false,
        error: statusResult.error || {
          type: 'unknown_error',
          message: 'Failed to retrieve account status',
        },
      }
    }

    const accountDetails = statusResult.data!
    const currentStatus = accountDetails.status
    const previousStatus = profile.stripe_account_status as StripeAccountStatus
    const statusChanged = currentStatus !== previousStatus

    console.log(`[VERIFICATION_CALLBACK] Status comparison - Previous: ${previousStatus || 'null'}, Current: ${currentStatus}, Changed: ${statusChanged}`)

    // Prepare update data (Requirement 6.1: Update profile record when status changes)
    const updateData: { 
      stripe_account_status: string
      stripe_account_id?: string
      updated_at?: string
    } = { 
      stripe_account_status: currentStatus,
      updated_at: new Date().toISOString(),
    }

    // Update account ID if it was provided and different
    if (accountId && accountId !== profile.stripe_account_id) {
      updateData.stripe_account_id = accountId
      console.log(`[VERIFICATION_CALLBACK] Updating account ID for user ${userId}: ${profile.stripe_account_id} -> ${accountId}`)
    }

    // Update profile with current status (Requirement 6.1)
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('[VERIFICATION_CALLBACK] Error updating profile status:', updateError)
      
      const error = {
        type: 'unknown_error' as const,
        message: 'Failed to update verification status in database',
        details: updateError,
      }
      
      await logVerificationEvent(userId, stripeAccountId, 'verification_failed', {
        previousStatus,
        currentStatus,
        statusChanged,
        error: `Database update error: ${updateError.message}`,
        requirements: accountDetails.requirements,
      })
      
      return { success: false, error }
    }

    // Log the callback processing and status change for audit purposes (Requirement 6.2)
    const processingTime = Date.now() - startTime
    
    if (statusChanged) {
      console.log(`[VERIFICATION_CALLBACK] ✅ Verification status updated for user ${userId}: ${previousStatus || 'null'} -> ${currentStatus} (${processingTime}ms)`)
      
      await logVerificationEvent(userId, stripeAccountId, 'status_updated', {
        previousStatus,
        currentStatus,
        statusChanged: true,
        requirements: accountDetails.requirements,
      })

      // Log verification completion if status is now complete
      if (currentStatus === 'complete') {
        await logVerificationEvent(userId, stripeAccountId, 'verification_completed', {
          previousStatus,
          currentStatus,
          statusChanged: true,
        })
      }
    } else {
      console.log(`[VERIFICATION_CALLBACK] ✅ Verification status confirmed for user ${userId}: ${currentStatus} (${processingTime}ms)`)
    }

    // Always log callback processing
    await logVerificationEvent(userId, stripeAccountId, 'callback_processed', {
      previousStatus,
      currentStatus,
      statusChanged,
      requirements: accountDetails.requirements,
    })

    return {
      success: true,
      data: {
        status: currentStatus,
        previousStatus,
        accountId: stripeAccountId,
        statusChanged,
      },
      message: statusChanged 
        ? `Verification status updated to ${currentStatus}`
        : `Verification status confirmed as ${currentStatus}`,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[VERIFICATION_CALLBACK] ❌ Error handling verification callback (${processingTime}ms):`, error)
    
    const stripeError = createStripeError(error)
    
    await logVerificationEvent(userId, accountId || 'unknown', 'verification_failed', {
      currentStatus: 'incomplete',
      statusChanged: false,
      error: `Unexpected error: ${stripeError.message}`,
    })
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Processes verification callback for the current user
 * This is a wrapper around handleVerificationCallback for client-side use
 */
export async function processVerificationCallback(): Promise<ServiceResponse<{
  status: StripeAccountStatus
  previousStatus?: StripeAccountStatus
  accountId: string
  statusChanged: boolean
  message?: string
}>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: {
          type: 'auth_error',
          message: 'Authentication required to process verification callback',
        },
      }
    }

    console.log(`[PROCESS_CALLBACK] Processing verification callback for user: ${user.id}`)
    
    // First check if user has a Stripe account before processing callback
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'User profile not found',
        },
      }
    }

    // Only process callbacks for washers with Stripe accounts
    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Verification callbacks only apply to washers',
        },
      }
    }

    if (!profile.stripe_account_id) {
      console.log(`[PROCESS_CALLBACK] User ${user.id} has no Stripe account, skipping callback processing`)
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'No Stripe account found for user - callback processing not needed',
        },
      }
    }
    
    const result = await handleVerificationCallback(user.id)
    
    if (result.success && result.data) {
      // Also update KYC progress for the 4-step onboarding flow
      if (result.data.status === 'complete' && result.data.accountId) {
        try {
          await updateKYCProgress(user.id, result.data.accountId)
          console.log(`[PROCESS_CALLBACK] KYC progress updated for user ${user.id}`)
        } catch (kycError) {
          console.warn('[PROCESS_CALLBACK] Failed to update KYC progress:', kycError)
          // Don't fail the entire callback processing if KYC progress update fails
        }
      }
      
      return {
        success: true,
        data: {
          ...result.data,
          message: result.message,
        },
        message: result.message,
      }
    }

    return {
      success: false,
      error: result.error || {
        type: 'unknown_error',
        message: 'Failed to process verification callback',
      },
    }
  } catch (error) {
    console.error('[PROCESS_CALLBACK] Error processing verification callback:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Creates or retrieves Stripe Connect account and generates onboarding link with comprehensive error handling
 */
export async function initializeStripeConnectOnboarding(userId: string): Promise<ServiceResponse<{
  accountId: string
  onboardingUrl: string
  isNewAccount: boolean
}>> {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`Initializing Stripe Connect onboarding for user: ${userId}`)

    // Get user's profile and auth info
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return {
        success: false,
        error: {
          type: 'auth_error',
          message: 'Authentication required',
        },
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, role, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Database error fetching profile:', profileError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to retrieve user profile',
          details: profileError,
        },
      }
    }

    if (!profile) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'User profile not found',
        },
      }
    }

    // Only washers can onboard
    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Only washers can complete Stripe Connect onboarding',
        },
      }
    }

    let accountId = profile.stripe_account_id
    let isNewAccount = false

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log(`Creating new Stripe Connect account for user: ${userId}`)
      
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          email: user.email || profile.email,
          business_type: 'individual',
          country: 'GB',
          capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true },
          },
        })

        accountId = account.id
        isNewAccount = true

        // Save account ID to profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            stripe_account_id: accountId,
            stripe_account_status: 'incomplete'
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to save account ID to profile:', updateError)
          return {
            success: false,
            error: {
              type: 'unknown_error',
              message: 'Failed to save account information',
              details: updateError,
            },
          }
        }

        console.log(`Created new Stripe Connect account: ${accountId}`)
      } catch (stripeError) {
        console.error('Error creating Stripe Connect account:', stripeError)
        const error = createStripeError(stripeError)
        return {
          success: false,
          error,
        }
      }
    }

    // Create onboarding link
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?onboarding=complete`,
        type: 'account_onboarding',
      })

      if (!accountLink.url) {
        return {
          success: false,
          error: {
            type: 'stripe_error',
            message: 'Failed to generate onboarding link',
          },
        }
      }

      console.log(`Generated onboarding link for account: ${accountId}`)

      return {
        success: true,
        data: {
          accountId,
          onboardingUrl: accountLink.url,
          isNewAccount,
        },
      }
    } catch (stripeError) {
      console.error('Error creating account link:', stripeError)
      const error = createStripeError(stripeError)
      return {
        success: false,
        error,
      }
    }
  } catch (error) {
    console.error('Error initializing Stripe Connect onboarding:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Middleware function to check if washer can access a specific route
 */
export async function requireWasherVerification(redirectTo?: string): Promise<{
  canAccess: boolean
  redirectUrl?: string
}> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        canAccess: false,
        redirectUrl: '/signin?message=Please+sign+in+to+access+this+page',
      }
    }

    const verificationResult = await canAccessWasherFeatures(user.id)
    
    if (!verificationResult.success) {
      console.error('Failed to check verification status:', verificationResult.error)
      return {
        canAccess: false,
        redirectUrl: '/washer/dashboard?message=Verification+status+check+failed',
      }
    }

    if (!verificationResult.data?.canAccess) {
      return {
        canAccess: false,
        redirectUrl: redirectTo || '/washer/dashboard?message=Please+complete+verification+to+access+this+feature',
      }
    }

    return {
      canAccess: true,
    }
  } catch (error) {
    console.error('Error in requireWasherVerification:', error)
    return {
      canAccess: false,
      redirectUrl: '/washer/dashboard?message=An+error+occurred+checking+verification+status',
    }
  }
}



/**
 * Manually synchronizes verification status with Stripe API
 * Useful for debugging and ensuring status consistency
 */
export async function syncVerificationStatus(userId?: string): Promise<ServiceResponse<{
  userId: string
  accountId: string
  previousStatus: StripeAccountStatus
  currentStatus: StripeAccountStatus
  statusChanged: boolean
  syncedAt: string
}>> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: {
          type: 'auth_error',
          message: 'Authentication required',
        },
      }
    }

    const targetUserId = userId || user.id

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, role')
      .eq('id', targetUserId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to retrieve user profile',
          details: profileError,
        },
      }
    }

    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'User is not a washer',
        },
      }
    }

    if (!profile.stripe_account_id) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'No Stripe account found for user',
        },
      }
    }

    console.log(`[SYNC_STATUS] Manually syncing verification status for user ${targetUserId}`)

    // Use the existing callback handler to sync status
    const syncResult = await handleVerificationCallback(targetUserId, profile.stripe_account_id)

    if (!syncResult.success) {
      return {
        success: false,
        error: syncResult.error || {
          type: 'unknown_error',
          message: 'Failed to sync verification status',
        },
      }
    }

    const syncedAt = new Date().toISOString()
    console.log(`[SYNC_STATUS] ✅ Status sync completed for user ${targetUserId} at ${syncedAt}`)

    return {
      success: true,
      data: {
        userId: targetUserId,
        accountId: syncResult.data!.accountId,
        previousStatus: syncResult.data!.previousStatus || 'incomplete',
        currentStatus: syncResult.data!.status,
        statusChanged: syncResult.data!.statusChanged,
        syncedAt,
      },
    }
  } catch (error) {
    console.error('[SYNC_STATUS] Error syncing verification status:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Gets comprehensive verification status for a user with comprehensive error handling
 */
export async function getWasherVerificationStatus(userId: string): Promise<ServiceResponse<{
  hasStripeAccount: boolean
  accountId?: string
  status: StripeAccountStatus
  canAccessFeatures: boolean
  requirements?: StripeAccountDetails['requirements']
  nextSteps: string[]
}>> {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`Getting verification status for user: ${userId}`)

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Database error fetching profile:', profileError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to retrieve user profile',
          details: profileError,
        },
      }
    }

    if (!profile) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'User profile not found',
        },
      }
    }

    // Non-washers don't need verification
    if (profile.role !== 'washer') {
      console.log(`User ${userId} is not a washer, no verification needed`)
      return {
        success: true,
        data: {
          hasStripeAccount: false,
          status: 'complete',
          canAccessFeatures: true,
          nextSteps: [],
        },
      }
    }

    // No Stripe account yet
    if (!profile.stripe_account_id) {
      console.log(`User ${userId} has no Stripe account`)
      return {
        success: true,
        data: {
          hasStripeAccount: false,
          status: 'incomplete',
          canAccessFeatures: false,
          nextSteps: ['Create Stripe Connect account', 'Complete identity verification'],
        },
      }
    }

    // Get current status from Stripe
    const statusResult = await getStripeAccountStatus(profile.stripe_account_id)

    if (!statusResult.success) {
      console.warn('Failed to get current Stripe status, falling back to cached status')
      
      // Fall back to cached status
      const cachedStatus = (profile.stripe_account_status as StripeAccountStatus) || 'incomplete'
      const nextSteps = cachedStatus === 'complete' ? [] : ['Complete verification process']
      
      return {
        success: true,
        data: {
          hasStripeAccount: true,
          accountId: profile.stripe_account_id,
          status: cachedStatus,
          canAccessFeatures: cachedStatus === 'complete',
          nextSteps,
        },
        message: 'Using cached verification status due to API error',
      }
    }

    const accountDetails = statusResult.data!
    const nextSteps: string[] = []

    // Determine next steps based on status with detailed messaging
    switch (accountDetails.status) {
      case 'incomplete':
        nextSteps.push('Complete Stripe Connect onboarding')
        break
      case 'pending':
        nextSteps.push('Wait for verification review')
        if (accountDetails.requirements?.pending_verification?.length) {
          nextSteps.push('Verification documents under review')
        }
        break
      case 'requires_action':
        if (accountDetails.requirements?.currently_due?.length) {
          nextSteps.push('Provide additional required information')
          // Add specific requirements if available
          accountDetails.requirements.currently_due.forEach(req => {
            nextSteps.push(`Complete: ${req.replace(/_/g, ' ')}`)
          })
        }
        if (accountDetails.requirements?.past_due?.length) {
          nextSteps.push('Complete overdue verification requirements')
          // Add specific overdue requirements
          accountDetails.requirements.past_due.forEach(req => {
            nextSteps.push(`Overdue: ${req.replace(/_/g, ' ')}`)
          })
        }
        break
      case 'rejected':
        nextSteps.push('Contact support for verification assistance')
        if (accountDetails.requirements?.disabled_reason) {
          nextSteps.push(`Reason: ${accountDetails.requirements.disabled_reason}`)
        }
        break
      case 'complete':
        // No next steps needed
        break
    }

    // Update cached status if different (with error handling)
    if (accountDetails.status !== profile.stripe_account_status) {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_account_status: accountDetails.status })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update cached status:', updateError)
          // Continue execution - this is not a critical failure
        } else {
          console.log(`Updated cached status for user ${userId}: ${profile.stripe_account_status} -> ${accountDetails.status}`)
        }
      } catch (updateError) {
        console.error('Exception updating cached status:', updateError)
        // Continue execution - this is not a critical failure
      }
    }

    console.log(`Verification status retrieved for user ${userId}: ${accountDetails.status}`)

    return {
      success: true,
      data: {
        hasStripeAccount: true,
        accountId: profile.stripe_account_id,
        status: accountDetails.status,
        canAccessFeatures: accountDetails.status === 'complete',
        requirements: accountDetails.requirements,
        nextSteps,
      },
    }
  } catch (error) {
    console.error('Error getting washer verification status:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Processes the onboarding fee payment for washers
 * Creates a Payment Intent for the £15 onboarding fee
 */
export async function processOnboardingPayment(userId: string): Promise<ServiceResponse<{
  clientSecret: string
  paymentIntentId: string
  amount: number
}>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_PAYMENT] Processing payment for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Get user's profile to verify they're a washer and haven't already paid
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, onboarding_fee_paid, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'User profile not found',
          details: profileError,
        },
      }
    }

    if (profile.role !== 'washer') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Only washers can pay the onboarding fee',
        },
      }
    }

    if (profile.onboarding_fee_paid) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Onboarding fee has already been paid',
        },
      }
    }

    // Create Payment Intent for £15 onboarding fee
    const amount = 1500 // £15 in pence
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'onboarding_fee',
        user_id: userId,
        user_email: profile.email || '',
      },
      description: 'Neighbourhood Wash - Washer Onboarding Fee',
    })

    if (!paymentIntent.client_secret) {
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to create payment intent',
        },
      }
    }

    console.log(`[ONBOARDING_PAYMENT] ✅ Payment Intent created for user ${userId}: ${paymentIntent.id}`)

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
      },
      message: 'Payment intent created successfully',
    }
  } catch (error) {
    console.error('[ONBOARDING_PAYMENT] Error processing payment:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}

/**
 * Confirms the onboarding fee payment and updates the user's profile
 * This is typically called after the payment is successful
 */
export async function confirmOnboardingPayment(userId: string, paymentIntentId: string): Promise<ServiceResponse<{ completed: boolean }>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    if (!paymentIntentId || typeof paymentIntentId !== 'string' || paymentIntentId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid payment intent ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_PAYMENT_CONFIRM] Confirming payment for user: ${userId}, payment: ${paymentIntentId}`)

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: `Payment not completed. Status: ${paymentIntent.status}`,
        },
      }
    }

    // Verify this payment is for the correct user
    if (paymentIntent.metadata.user_id !== userId) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Payment does not belong to this user',
        },
      }
    }

    // Update the user's profile to mark onboarding fee as paid
    const supabase = createSupabaseServerClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_fee_paid: true })
      .eq('id', userId)

    if (updateError) {
      console.error('[ONBOARDING_PAYMENT_CONFIRM] Error updating profile:', updateError)
      return {
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to update payment status',
          details: updateError,
        },
      }
    }

    console.log(`[ONBOARDING_PAYMENT_CONFIRM] ✅ Payment confirmed for user ${userId}`)

    return {
      success: true,
      data: { completed: true },
      message: 'Onboarding payment confirmed successfully',
    }
  } catch (error) {
    console.error('[ONBOARDING_PAYMENT_CONFIRM] Error confirming payment:', error)
    const stripeError = createStripeError(error)
    
    return {
      success: false,
      error: stripeError,
    }
  }
}



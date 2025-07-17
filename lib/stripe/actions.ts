'use server'

import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verificationAnalytics } from '@/lib/monitoring/verification-analytics'
import {
  trackApiCallAction,
  trackRetryAttemptAction,
  trackVerificationFailedAction,
  trackAccountCreatedAction,
  trackOnboardingLinkGeneratedAction,
  trackCallbackReceivedAction,
  trackStatusUpdatedAction,
  trackVerificationCompletedAction,
  trackStripeRedirectAction
} from '@/lib/monitoring/verification-analytics-actions'
import { 
  withStripeApiMonitoring,
  withDatabaseMonitoring,
  withVerificationStepMonitoring
} from '@/lib/monitoring/performance-monitor'
import { createSessionId } from '@/lib/monitoring/performance-utils'

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
      () => supabase
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
  
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

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
export async function canAccessWasherFeatures(userId: string): Promise<ServiceResponse<{
  canAccess: boolean
  status: StripeAccountStatus
  accountId?: string
  requirements?: StripeAccountDetails['requirements']
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

    console.log(`Checking washer feature access for user: ${userId}`)

    // Get user's profile with Stripe account information
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

    // Only washers need verification
    if (profile.role !== 'washer') {
      console.log(`User ${userId} is not a washer, granting full access`)
      return {
        success: true,
        data: {
          canAccess: true,
          status: 'complete',
        },
      }
    }

    // If no Stripe account, they can't access features
    if (!profile.stripe_account_id) {
      console.log(`User ${userId} has no Stripe account, access denied`)
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
      console.warn('Failed to get current Stripe status, falling back to cached status')
      
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
          console.error('Failed to update cached status:', updateError)
          // Continue execution - this is not a critical failure
        } else {
          console.log(`Updated cached status for user ${userId}: ${profile.stripe_account_status} -> ${currentStatus}`)
        }
      } catch (updateError) {
        console.error('Exception updating cached status:', updateError)
        // Continue execution - this is not a critical failure
      }
    }

    // Only 'complete' status allows full access
    const canAccess = currentStatus === 'complete'

    console.log(`Access check result for user ${userId}: ${canAccess ? 'granted' : 'denied'} (status: ${currentStatus})`)

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
    console.error('Error checking washer feature access:', error)
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
    requirements?: any
  },
  sessionId?: string
): Promise<void> {
  try {
    // Use the new analytics system for comprehensive tracking
    await verificationAnalytics.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
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
    
    const result = await handleVerificationCallback(user.id)
    
    if (result.success && result.data) {
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

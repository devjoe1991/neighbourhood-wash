'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

interface PayoutActionResult {
  success: boolean
  message?: string
  data?: unknown
}

interface WasherBalance {
  available_balance: number
  processing_balance: number
  total_paid_out: number
  total_earnings: number
  available_bookings_count: number
}

interface StripeAccountDetails {
  id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  requirements: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
  }
  capabilities: {
    transfers: string
  }
}

/**
 * Get current user's washer balance and earnings summary
 */
export async function getWasherBalance(): Promise<PayoutActionResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required. Please log in again.',
      }
    }

    // Verify user is a washer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'washer') {
      return {
        success: false,
        message: 'Only washers can access balance information.',
      }
    }

    // Get balance from view
    const { data: balance, error: balanceError } = await supabase
      .from('washer_balances')
      .select('*')
      .eq('washer_id', user.id)
      .single()

    if (balanceError) {
      return {
        success: false,
        message: 'Unable to fetch balance information.',
      }
    }

    return {
      success: true,
      data: balance,
    }
  } catch (error) {
    console.error('Error getting washer balance:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

/**
 * Get detailed Stripe account information and verification status
 */
export async function getStripeAccountStatus(): Promise<PayoutActionResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required.',
      }
    }

    // Get user's Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'washer') {
      return {
        success: false,
        message: 'Only washers can access Stripe account information.',
      }
    }

    if (!profile.stripe_account_id) {
      return {
        success: true,
        data: {
          connected: false,
          account_status: 'not_connected',
          message: 'No Stripe account connected',
        },
      }
    }

    // Fetch detailed account information from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    const accountDetails: StripeAccountDetails = {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || [],
      },
      capabilities: {
        transfers: account.capabilities?.transfers || 'inactive',
      },
    }

    // Determine overall account status
    let status = 'incomplete'
    let canReceivePayouts = false

    if (
      accountDetails.details_submitted &&
      accountDetails.charges_enabled &&
      accountDetails.payouts_enabled &&
      accountDetails.requirements.currently_due.length === 0 &&
      accountDetails.requirements.past_due.length === 0
    ) {
      status = 'active'
      canReceivePayouts = true
    } else if (accountDetails.details_submitted) {
      status = 'pending_verification'
    }

    // Update the account status in our database
    await supabase
      .from('profiles')
      .update({ stripe_account_status: status })
      .eq('id', user.id)

    return {
      success: true,
      data: {
        connected: true,
        account_status: status,
        can_receive_payouts: canReceivePayouts,
        details: accountDetails,
        requirements_message: getRequirementsMessage(accountDetails),
      },
    }
  } catch (error) {
    console.error('Error getting Stripe account status:', error)
    return {
      success: false,
      message: 'Unable to verify Stripe account status.',
    }
  }
}

/**
 * Create a new payout request
 */
export async function createPayoutRequest(
  amount: number,
  notes?: string
): Promise<PayoutActionResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required.',
      }
    }

    // Verify user is a washer with verified Stripe account
    const stripeStatus = await getStripeAccountStatus()
    const stripeData = stripeStatus.data as { can_receive_payouts?: boolean }
    if (!stripeStatus.success || !stripeData?.can_receive_payouts) {
      return {
        success: false,
        message:
          'Your Stripe account must be fully verified before requesting payouts.',
      }
    }

    // Get current balance
    const balanceResult = await getWasherBalance()
    if (!balanceResult.success) {
      return {
        success: false,
        message: 'Unable to verify account balance.',
      }
    }

    const balance = balanceResult.data as WasherBalance
    const minimumPayout = 10.0 // £10 minimum
    const withdrawalFee = 2.5 // £2.50 fee

    // Validate payout amount
    if (amount < minimumPayout) {
      return {
        success: false,
        message: `Minimum payout amount is £${minimumPayout}.`,
      }
    }

    if (amount > balance.available_balance) {
      return {
        success: false,
        message: `Insufficient balance. Available: £${balance.available_balance.toFixed(2)}`,
      }
    }

    const netAmount = amount - withdrawalFee

    if (netAmount <= 0) {
      return {
        success: false,
        message: `Payout amount must be greater than withdrawal fee of £${withdrawalFee}.`,
      }
    }

    // Create payout request
    const { data: payoutRequest, error: requestError } = await supabase
      .from('payout_requests')
      .insert({
        washer_id: user.id,
        requested_amount: amount,
        withdrawal_fee: withdrawalFee,
        net_amount: netAmount,
        request_notes: notes || null,
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating payout request:', requestError)
      return {
        success: false,
        message: 'Failed to create payout request.',
      }
    }

    // Update earnings status to 'processing' for the requested amount
    await updateEarningsStatusForPayout(user.id, amount)

    revalidatePath('/dashboard/payouts')

    return {
      success: true,
      message: `Payout request for £${amount.toFixed(2)} created successfully. You'll receive £${netAmount.toFixed(2)} after the £${withdrawalFee} withdrawal fee.`,
      data: payoutRequest,
    }
  } catch (error) {
    console.error('Error creating payout request:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

/**
 * Get user's payout request history
 */
export async function getPayoutRequests(): Promise<PayoutActionResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required.',
      }
    }

    const { data: requests, error: requestsError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('washer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (requestsError) {
      return {
        success: false,
        message: 'Unable to fetch payout history.',
      }
    }

    return {
      success: true,
      data: requests,
    }
  } catch (error) {
    console.error('Error getting payout requests:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

/**
 * Create or get Stripe Connect account for payout setup
 */
export async function setupStripeAccount(): Promise<PayoutActionResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required.',
      }
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'washer') {
      return {
        success: false,
        message: 'Only washers can set up payment accounts.',
      }
    }

    let accountId = profile.stripe_account_id

    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || profile.email,
        business_type: 'individual',
        country: 'GB',
      })

      accountId = account.id

      // Save account ID
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/payouts`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/payouts?setup_success=true`,
      type: 'account_onboarding',
    })

    return {
      success: true,
      data: {
        onboarding_url: accountLink.url,
      },
    }
  } catch (error) {
    console.error('Error setting up Stripe account:', error)
    return {
      success: false,
      message: 'Failed to set up payment account.',
    }
  }
}

/**
 * Helper function to update earnings status when creating payout request
 */
async function updateEarningsStatusForPayout(
  washerId: string,
  amount: number
): Promise<void> {
  const supabase = createSupabaseServerClient()

  // Get available earnings ordered by date (FIFO)
  const { data: earnings, error } = await supabase
    .from('earnings')
    .select('id, washer_earnings')
    .eq('washer_id', washerId)
    .eq('status', 'available')
    .order('made_available_at', { ascending: true })

  if (error || !earnings) return

  let remainingAmount = amount
  const earningsToUpdate: number[] = []

  for (const earning of earnings) {
    if (remainingAmount <= 0) break

    earningsToUpdate.push(earning.id)
    remainingAmount -= earning.washer_earnings

    if (remainingAmount <= 0) break
  }

  // Update status to 'processing'
  if (earningsToUpdate.length > 0) {
    await supabase
      .from('earnings')
      .update({ status: 'processing' })
      .in('id', earningsToUpdate)
  }
}

/**
 * Helper function to generate requirements message
 */
function getRequirementsMessage(account: StripeAccountDetails): string {
  const { requirements } = account

  if (requirements.past_due.length > 0) {
    return 'Your account has overdue requirements that must be completed immediately.'
  }

  if (requirements.currently_due.length > 0) {
    return 'Your account has pending requirements that need to be completed.'
  }

  if (requirements.pending_verification.length > 0) {
    return 'Your account information is being verified. This usually takes 1-2 business days.'
  }

  if (requirements.eventually_due.length > 0) {
    return 'Your account will need additional information in the future.'
  }

  return 'Your account is fully verified and ready to receive payouts.'
}

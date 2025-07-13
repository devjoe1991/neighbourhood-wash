'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe/server'

interface ActionResult {
  success: boolean
  message: string
  data?: unknown
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
 * Creates a Stripe Connect account if one doesn't exist,
 * and returns a unique onboarding link for the washer.
 * This is a single action for the client to call.
 */
export async function createStripeOnboardingLink(): Promise<{
  success: boolean
  message: string
  url?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, message: 'Authentication failed.' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, message: 'Profile not found.' }
    }

    if (profile.role !== 'washer') {
      return {
        success: false,
        message: 'Only washers can connect payment accounts.',
      }
    }

    let accountId = profile.stripe_account_id

    // Create a new Stripe Connect Express account if the user doesn't have one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || profile.email,
        business_type: 'individual',
        country: 'GB',
      })
      accountId = account.id

      // Save the new account ID to the user's profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)

      if (updateError) {
        return {
          success: false,
          message: 'Failed to save account information.',
        }
      }
    }

    // Create the unique, single-use onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
      type: 'account_onboarding',
    })

    if (!accountLink.url) {
      return {
        success: false,
        message: 'Could not create Stripe onboarding link.',
      }
    }

    return {
      success: true,
      message: 'Onboarding link created successfully.',
      url: accountLink.url,
    }
  } catch (error) {
    console.error('Error creating Stripe onboarding link:', error)
    return { success: false, message: 'An unexpected error occurred.' }
  }
}

/**
 * Get detailed Stripe account information and verification status for the current washer
 */
export async function getWasherStripeAccountStatus(): Promise<ActionResult> {
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
        message: 'No Stripe account connected',
        data: {
          connected: false,
          account_status: 'not_connected',
          can_receive_payouts: false,
          requirements_message: 'Account not connected',
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
      message: 'Successfully retrieved account status.',
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
 * Get current user's washer balance and earnings summary
 */
export async function getWasherBalance(): Promise<ActionResult> {
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
      message: 'Successfully fetched washer balance.',
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
 * Create a new payout request
 */
export async function createPayoutRequest(
  amount: number
): Promise<ActionResult> {
  const WITHDRAWAL_FEE = 2.5
  const MINIMUM_PAYOUT = 10.0

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, message: 'Authentication failed.' }
    }

    // Check if it's the user's first completed payout
    const { count: completedPayoutsCount, error: countError } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact', head: true })
      .eq('washer_id', user.id)
      .eq('status', 'completed')

    if (countError) {
      console.error('Error checking for previous payouts:', countError)
      return {
        success: false,
        message: 'Could not verify payout history. Please try again.',
      }
    }

    const isFirstPayout = completedPayoutsCount === 0
    const actualWithdrawalFee = isFirstPayout ? 0 : WITHDRAWAL_FEE

    const { data: balanceData, error: balanceError } = await supabase.rpc(
      'get_washer_balance_details',
      { p_user_id: user.id }
    )

    if (balanceError || !balanceData) {
      return {
        success: false,
        message: 'Could not retrieve your current balance.',
      }
    }

    const availableBalance = balanceData.available_balance

    if (amount < MINIMUM_PAYOUT) {
      return {
        success: false,
        message: `Minimum payout amount is £${MINIMUM_PAYOUT.toFixed(2)}.`,
      }
    }

    if (amount > availableBalance) {
      return {
        success: false,
        message: 'Requested amount exceeds your available balance.',
      }
    }

    const payoutAmount = amount - actualWithdrawalFee

    if (payoutAmount <= 0) {
      return {
        success: false,
        message:
          'Payout amount after fees is not positive. Please request a higher amount.',
      }
    }

    // Insert into payout_requests table
    const { data: request, error: requestError } = await supabase
      .from('payout_requests')
      .insert({
        washer_id: user.id,
        amount_requested: amount,
        withdrawal_fee: actualWithdrawalFee,
        amount_to_payout: payoutAmount,
        status: 'pending',
        notes: isFirstPayout ? 'First payout: Fee waived.' : null,
      })
      .select('id')
      .single()

    if (requestError) {
      return {
        success: false,
        message: `Failed to create payout request: ${requestError.message}`,
      }
    }

    // Update the status of the related earnings records
    await updateEarningsStatusForPayout(user.id, amount)

    return {
      success: true,
      message: `Payout request for £${amount.toFixed(
        2
      )} submitted successfully.`,
      data: {
        requestId: request.id,
        feeWaived: isFirstPayout,
      },
    }
  } catch (error) {
    console.error('Error creating payout request:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while creating your request.',
    }
  }
}

/**
 * Get user's payout request history
 */
export async function getPayoutRequests(): Promise<ActionResult> {
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
      message: 'Successfully fetched payout history.',
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
 * Checks if the current washer is eligible for the "first payout fee waived" offer.
 */
export async function isEligibleForFreePayout(): Promise<{
  eligible: boolean
  message: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { eligible: false, message: 'Authentication failed.' }
    }

    const { count, error } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact', head: true })
      .eq('washer_id', user.id)
      .eq('status', 'completed')

    if (error) {
      console.error('Error checking payout eligibility:', error)
      return {
        eligible: false,
        message: 'Could not verify payout history.',
      }
    }

    return {
      eligible: count === 0,
      message:
        count === 0
          ? 'User is eligible for first free payout.'
          : 'User has previous completed payouts.',
    }
  } catch (error) {
    console.error('Error in isEligibleForFreePayout:', error)
    return {
      eligible: false,
      message: 'An unexpected error occurred.',
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
    return 'Your information is being verified by Stripe. This can take a few minutes to a couple of business days.'
  }

  if (requirements.eventually_due.length > 0) {
    return 'Your account will need additional information in the future.'
  }

  return 'Your account is fully verified and ready to receive payouts.'
}

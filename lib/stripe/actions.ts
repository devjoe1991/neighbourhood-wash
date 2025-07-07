'use server'

import { createClient } from '@/utils/supabase/server_new'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient()

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
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment_cancelled=true`,
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
 */
export async function createAndOnboardStripeConnectAccount() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin')
  }

  // 1. Create a new Stripe Connect Express account for the user
  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual',
    country: 'GB',
  })

  if (!account) {
    throw new Error('Could not create Stripe Connect account')
  }

  // 2. Save the new account ID to the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ stripe_account_id: account.id })
    .eq('id', user.id)

  if (error) {
    throw new Error('Could not save Stripe account ID to user profile.')
  }

  // 3. Create the unique, single-use onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?connect_success=true`,
    type: 'account_onboarding',
  })

  if (!accountLink.url) {
    throw new Error('Could not create Stripe account link')
  }

  // Revalidate path to ensure profile data is fresh on the client
  revalidatePath('/dashboard')

  // 4. Redirect the user to the onboarding link
  return redirect(accountLink.url)
}

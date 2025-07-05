// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.3.0'
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('EDGE_FUNCTION_SUPABASE_URL')!,
  Deno.env.get('EDGE_FUNCTION_SUPABASE_SERVICE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!

  let event: Stripe.Event

  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      signingSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return new Response(err.message, { status: 400 })
  }

  // Log the event type for debugging
  console.log(`Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (!userId) {
          throw new Error('Missing user ID in checkout session')
        }

        console.log(`Processing checkout.session.completed for user: ${userId}`)
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ onboarding_fee_paid: true })
          .eq('id', userId)

        if (error) throw error
        console.log(`Successfully updated profile for user: ${userId}`)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const accountId = account.id

        console.log(`Processing account.updated for account: ${accountId}`)

        const newStatus =
          account.charges_enabled && account.payouts_enabled
            ? 'enabled'
            : 'restricted'

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_account_status: newStatus })
          .eq('stripe_account_id', accountId)

        if (error) throw error
        console.log(
          `Successfully updated status for account: ${accountId} to ${newStatus}`
        )
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook event:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/handle-stripe-webhooks' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

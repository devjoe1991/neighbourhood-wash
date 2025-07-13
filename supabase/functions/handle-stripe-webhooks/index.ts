import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { stripe, corsHeaders } from '../_shared/stripe.ts' // Assuming corsHeaders is in stripe.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define the type for the checkout session metadata
interface CheckoutSessionMetadata {
  bookingId: string
  userId: string
  washerId: string
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const metadata = session.metadata as CheckoutSessionMetadata
        const bookingId = parseInt(metadata.bookingId, 10)

        if (!bookingId) {
          throw new Error('Booking ID missing from checkout session metadata')
        }

        console.log(`Processing successful payment for booking: ${bookingId}`)

        // Create an admin Supabase client to update the database
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Update the booking status to 'awaiting_washer_acceptance'
        // This indicates payment is complete and it's ready for a washer.
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'awaiting_washer_acceptance',
            payment_status: 'paid', // Add a dedicated payment status
            payment_intent_id: session.payment_intent, // Store the payment intent ID
          })
          .eq('id', bookingId)
          .select()

        if (error) {
          throw new Error(`Supabase DB error: ${error.message}`)
        }

        console.log(`Booking ${bookingId} successfully updated:`, data)
        // TODO: Trigger notifications to user and washer assignment logic here

        break
      }
      // Handle washer account updates
      case 'account.updated': {
        const account = event.data.object

        // Create an admin Supabase client
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Logic to determine the status of the account
        const payouts_enabled = account.payouts_enabled
        const charges_enabled = account.charges_enabled
        const details_submitted = account.details_submitted

        let status = 'pending'
        if (details_submitted) {
          if (payouts_enabled && charges_enabled) {
            status = 'active'
          } else {
            status = 'restricted'
          }
        }

        // Update the profile in your database
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_account_status: status,
            stripe_payouts_enabled: payouts_enabled,
            stripe_charges_enabled: charges_enabled,
          })
          .eq('stripe_account_id', account.id)

        if (error) {
          console.error(
            'Error updating profile for account.updated webhook:',
            error
          )
        } else {
          console.log(
            `Successfully updated profile for Stripe account ${account.id} to status: ${status}`
          )
        }

        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders,
      status: 200,
    })
  } catch (err) {
    console.error('Webhook Error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, {
      headers: corsHeaders,
      status: 400,
    })
  }
})

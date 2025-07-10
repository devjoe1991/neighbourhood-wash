import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { stripe } from '../_shared/stripe.ts'

serve(async (req) => {
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
        // ... handle checkout session completed
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

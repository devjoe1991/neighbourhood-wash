'use server'

import Stripe from 'stripe'

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

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

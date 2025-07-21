import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { paymentService } from '@/lib/payment/payment-service'
import { earningsService } from '@/lib/payment/earnings-service'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Received Stripe webhook:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id)

    // Confirm payment through payment service
    const result = await paymentService.confirmPayment(paymentIntent.id)

    if (!result.success) {
      console.error('Failed to confirm payment:', result.error)
      return
    }

    console.log('Payment confirmed successfully:', result.data?.id)

    // If this is a booking payment, trigger earnings calculation
    if (paymentIntent.metadata.bookingId) {
      const supabase = createSupabaseServerClient()
      
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('washer_id, completed_at')
        .eq('id', paymentIntent.metadata.bookingId)
        .single()

      if (booking && booking.washer_id && booking.completed_at) {
        // Calculate earnings for the washer
        const completedDate = new Date(booking.completed_at)
        const monthStart = new Date(completedDate.getFullYear(), completedDate.getMonth(), 1)
        const monthEnd = new Date(completedDate.getFullYear(), completedDate.getMonth() + 1, 0)

        await earningsService.createEarningsPeriod(
          booking.washer_id,
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0]
        )
      }
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id)

    const supabase = createSupabaseServerClient()

    // Update booking status
    if (paymentIntent.metadata.bookingId) {
      await supabase
        .from('bookings')
        .update({ 
          payment_status: 'failed',
          status: 'cancelled'
        })
        .eq('payment_intent_id', paymentIntent.id)
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    console.log('Payment failure processed for:', paymentIntent.id)
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log('Processing account update:', account.id)

    const supabase = createSupabaseServerClient()

    // Determine account status
    let status = 'incomplete'
    if (account.details_submitted) {
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'complete'
      } else if (account.requirements?.currently_due?.length || account.requirements?.past_due?.length) {
        status = 'requires_action'
      } else {
        status = 'pending'
      }
    }

    // Update washer profile with new account status
    await supabase
      .from('washer_profiles')
      .update({ 
        stripe_account_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id)

    console.log('Account status updated:', account.id, status)
  } catch (error) {
    console.error('Error handling account update:', error)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    console.log('Processing transfer created:', transfer.id)

    const supabase = createSupabaseServerClient()

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('stripe_transfer_id', transfer.id)

    console.log('Transfer processed successfully:', transfer.id)
  } catch (error) {
    console.error('Error handling transfer created:', error)
  }
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  try {
    console.log('Processing transfer failed:', transfer.id)

    const supabase = createSupabaseServerClient()

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('stripe_transfer_id', transfer.id)

    // Reset earnings payout status if this was a payout
    if (transfer.metadata?.washerId) {
      await supabase
        .from('washer_earnings')
        .update({ payout_status: 'failed' })
        .eq('washer_id', transfer.metadata.washerId)
        .eq('payout_status', 'processing')
    }

    console.log('Transfer failure processed:', transfer.id)
  } catch (error) {
    console.error('Error handling transfer failed:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session completed:', session.id)

    const supabase = createSupabaseServerClient()

    // Check if this is a washer onboarding fee payment
    if (session.client_reference_id && session.mode === 'payment') {
      const userId = session.client_reference_id

      // Update user profile to mark onboarding fee as paid
      await supabase
        .from('profiles')
        .update({ onboarding_fee_paid: true })
        .eq('id', userId)

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'fee',
          amount: (session.amount_total || 0) / 100, // Convert from pence
          currency: session.currency || 'gbp',
          status: 'completed',
          description: 'Washer onboarding fee',
          processed_at: new Date().toISOString()
        })

      console.log('Onboarding fee payment processed for user:', userId)
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}
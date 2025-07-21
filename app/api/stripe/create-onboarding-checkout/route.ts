import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, successUrl, cancelUrl } = await request.json()

    if (!userId || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Washer Onboarding Fee',
              description: 'One-time setup fee to join the washer network',
            },
            unit_amount: amount, // Amount in pence
          },
          quantity: 1,
        },
      ],
      customer_email: profile.email,
      client_reference_id: userId,
      metadata: {
        userId,
        type: 'onboarding_fee',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
    })

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      }
    })

  } catch (error) {
    console.error('Error creating onboarding checkout:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create checkout session' 
      },
      { status: 500 }
    )
  }
}
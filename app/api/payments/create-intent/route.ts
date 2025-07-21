import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { paymentService } from '@/lib/payment/payment-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { bookingId, amount } = await request.json()

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Booking ID and valid amount are required' },
        { status: 400 }
      )
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent(
      bookingId,
      amount,
      user.id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create payment intent' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in create payment intent API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
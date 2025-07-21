import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer profile
    const { data: customerProfile } = await supabase
      .from('customer_profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // For now, return mock data since Stripe integration would be needed for real payment methods
    // In a real implementation, you would fetch from Stripe using customerProfile.stripe_customer_id
    const mockPaymentMethods = [
      {
        id: 'pm_1234567890',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
        created_at: new Date().toISOString(),
        billing_address: {
          line1: '123 Main St',
          city: 'London',
          postal_code: 'SW1A 1AA',
          country: 'GB'
        }
      }
    ]

    return NextResponse.json({
      success: true,
      payment_methods: mockPaymentMethods
    })

  } catch (error) {
    console.error('Error in payment methods API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
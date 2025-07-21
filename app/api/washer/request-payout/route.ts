import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { earningsService } from '@/lib/payment/earnings-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get washer profile
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (washerError || !washerProfile) {
      return NextResponse.json({ error: 'Washer profile not found' }, { status: 404 })
    }

    // Check if washer has completed onboarding and has Stripe account
    if (!washerProfile.stripe_account_id) {
      return NextResponse.json({ 
        error: 'Payment account not connected. Please complete onboarding first.' 
      }, { status: 400 })
    }

    // Request payout through earnings service
    const payoutResult = await earningsService.requestPayout(washerProfile.id)

    if (!payoutResult.success) {
      return NextResponse.json({ 
        error: payoutResult.error?.message || 'Failed to process payout request' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      payout: payoutResult.data
    })

  } catch (error) {
    console.error('Error in payout request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
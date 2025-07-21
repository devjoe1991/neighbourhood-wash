import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { accountId, refreshUrl, returnUrl } = await request.json()

    if (!accountId || !refreshUrl || !returnUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the account belongs to the user
    const { data: washerProfile } = await supabase
      .from('washer_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .eq('stripe_account_id', accountId)
      .single()

    if (!washerProfile) {
      return NextResponse.json(
        { success: false, error: 'Account not found or unauthorized' },
        { status: 403 }
      )
    }

    // Create account link for bank connection
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    if (!accountLink.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create account link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }
    })

  } catch (error) {
    console.error('Error creating bank link:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create bank link' 
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
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

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountId)

    // Check if external accounts (bank accounts) are connected
    const hasBank = account.external_accounts && account.external_accounts.data.length > 0
    
    let bankDetails = {}
    if (hasBank && account.external_accounts?.data?.[0]) {
      const bankAccount = account.external_accounts?.data?.[0] as any
      bankDetails = {
        bankName: bankAccount.bank_name || 'Bank Account',
        accountType: bankAccount.object === 'bank_account' ? 'Bank Account' : 'Card',
        last4: bankAccount.last4 || '****',
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasBank,
        ...bankDetails,
      }
    })

  } catch (error) {
    console.error('Error checking bank status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check bank status' 
      },
      { status: 500 }
    )
  }
}
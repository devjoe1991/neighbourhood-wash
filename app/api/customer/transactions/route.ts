import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { paymentService } from '@/lib/payment/payment-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filters
    const filters: any = {
      limit,
      offset
    }

    if (type) filters.type = type
    if (status) filters.status = status
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    // Get transaction history
    const result = await paymentService.getTransactionHistory(user.id, filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedTransactions = result.data?.map((transaction: any) => ({
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      description: transaction.description,
      created_at: transaction.created_at,
      type: transaction.type,
      booking_id: transaction.booking_id,
      stripe_payment_intent_id: transaction.stripe_payment_intent_id,
      processed_at: transaction.processed_at
    })) || []

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions
    })

  } catch (error) {
    console.error('Error in transactions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
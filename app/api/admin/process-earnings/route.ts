import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { earningsService } from '@/lib/payment/earnings-service'

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

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (rolesError) {
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { startDate, endDate } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Process periodic earnings for all washers
    const result = await earningsService.processPeriodicEarnings(startDate, endDate)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to process earnings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result: result.data
    })

  } catch (error) {
    console.error('Error in process earnings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking earnings processing status
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (rolesError) {
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get earnings processing statistics
    const { data: earningsStats, error: statsError } = await supabase
      .from('washer_earnings')
      .select('payout_status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (statsError) {
      return NextResponse.json(
        { error: 'Failed to fetch earnings statistics' },
        { status: 500 }
      )
    }

    const stats = {
      total_periods: earningsStats?.length || 0,
      pending_payouts: earningsStats?.filter(e => e.payout_status === 'pending').length || 0,
      processing_payouts: earningsStats?.filter(e => e.payout_status === 'processing').length || 0,
      completed_payouts: earningsStats?.filter(e => e.payout_status === 'paid').length || 0,
      failed_payouts: earningsStats?.filter(e => e.payout_status === 'failed').length || 0
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error in earnings stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
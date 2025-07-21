import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { earningsService } from '@/lib/payment/earnings-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get washer profile
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (washerError || !washerProfile) {
      return NextResponse.json({ error: 'Washer profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current'

    // Calculate current period dates
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get today's earnings
    const todayResult = await earningsService.calculateEarnings(
      washerProfile.id,
      today.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    )

    // Get week's earnings
    const weekResult = await earningsService.calculateEarnings(
      washerProfile.id,
      weekStart.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    )

    // Get month's earnings
    const monthResult = await earningsService.calculateEarnings(
      washerProfile.id,
      monthStart.toISOString().split('T')[0],
      monthEnd.toISOString().split('T')[0]
    )

    // Get pending earnings
    const pendingResult = await earningsService.getPendingEarnings(washerProfile.id)

    // Get earnings history
    const historyResult = await earningsService.getEarningsHistory(washerProfile.id, 6)

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get last payout
    const { data: lastPayout } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .eq('type', 'payout')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const earningsData = {
      today: todayResult.success ? todayResult.data : {
        grossEarnings: 0,
        netEarnings: 0,
        jobsCompleted: 0,
        totalHoursWorked: 0
      },
      week: weekResult.success ? weekResult.data : {
        grossEarnings: 0,
        netEarnings: 0,
        jobsCompleted: 0,
        totalHoursWorked: 0
      },
      month: monthResult.success ? monthResult.data : {
        grossEarnings: 0,
        netEarnings: 0,
        jobsCompleted: 0,
        totalHoursWorked: 0
      },
      pending_payout: pendingResult.success ? pendingResult.data : 0,
      earnings_history: historyResult.success ? historyResult.data : [],
      last_payout: lastPayout ? {
        amount: lastPayout.amount,
        date: lastPayout.created_at
      } : null,
      recent_transactions: (transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || `${t.type} transaction`,
        date: t.created_at,
        status: t.status
      }))
    }

    return NextResponse.json({
      success: true,
      earnings: earningsData
    })
  } catch (error) {
    console.error('Error in earnings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
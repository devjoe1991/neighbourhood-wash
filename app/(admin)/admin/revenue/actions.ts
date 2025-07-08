import { createSupabaseServerClient } from '@/utils/supabase/server'



export interface RevenueMetrics {
  totalRevenue: number
  monthlyRevenue: number
  averageCommissionPerBooking: number
  totalBookings: number
  monthlyGrowth: number
  availableBalance: number
  outstandingLiabilities: number
  netCashPosition: number
  // Withdrawal fee revenue tracking
  totalWithdrawalFees: number
  monthlyWithdrawalFees: number
  withdrawalFeeGrowth: number
  totalWithdrawalRequests: number
}

export interface DailyRevenue {
  date: string
  bookings: number
  grossRevenue: number
  commission: number
  averageCommission: number
  withdrawalFees: number
  withdrawalRequests: number
}

export interface TopWasher {
  washerName: string
  bookingsCompleted: number
  commissionGenerated: number
  averageBookingValue: number
}

export interface MonthlyGrowth {
  year: number
  month: number
  monthlyCommission: number
  previousMonth: number | null
  growthPercentage: number | null
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Get total platform revenue (all-time commission)
    const { data: totalData, error: totalError } = await supabase
      .from('earnings')
      .select('platform_fee')
    
    if (totalError) throw totalError
    
    const totalRevenue = totalData?.reduce((sum: number, record: { platform_fee: number }) => sum + Number(record.platform_fee), 0) || 0
    
    // Get current month revenue
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('earnings')
      .select('platform_fee, booking_total')
      .gte('created_at', firstDayOfMonth.toISOString())
    
    if (monthlyError) throw monthlyError
    
    const monthlyRevenue = monthlyData?.reduce((sum: number, record: { platform_fee: number }) => sum + Number(record.platform_fee), 0) || 0
    const totalBookings = totalData?.length || 0
    
    // Calculate average commission per booking
    const averageCommissionPerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0
    
    // Get previous month for growth calculation
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const lastDayOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0)
    
    const { data: previousMonthData, error: previousError } = await supabase
      .from('earnings')
      .select('platform_fee')
      .gte('created_at', previousMonth.toISOString())
      .lte('created_at', lastDayOfPreviousMonth.toISOString())
    
    if (previousError) throw previousError
    
    const previousMonthRevenue = previousMonthData?.reduce((sum: number, record: { platform_fee: number }) => sum + Number(record.platform_fee), 0) || 0
    const monthlyGrowth = previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0
    
    // Calculate cash flow metrics
    const { data: payoutData, error: payoutError } = await supabase
      .from('payout_requests')
      .select('net_amount, status')
      .in('status', ['pending', 'approved', 'processing'])
    
    if (payoutError) throw payoutError
    
    const outstandingLiabilities = payoutData?.reduce((sum: number, record: { net_amount: number }) => sum + Number(record.net_amount), 0) || 0
    const availableBalance = totalRevenue - outstandingLiabilities
    const netCashPosition = availableBalance
    
    // Get withdrawal fee revenue data
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('payout_requests')
      .select('withdrawal_fee, created_at, status')
      .in('status', ['completed', 'approved', 'processing', 'pending'])
    
    if (withdrawalError) throw withdrawalError
    
    const totalWithdrawalFees = withdrawalData?.reduce((sum: number, record: { withdrawal_fee: number }) => sum + Number(record.withdrawal_fee), 0) || 0
    const totalWithdrawalRequests = withdrawalData?.length || 0
    
    // Get current month withdrawal fees
    const { data: monthlyWithdrawalData, error: monthlyWithdrawalError } = await supabase
      .from('payout_requests')
      .select('withdrawal_fee')
      .gte('created_at', firstDayOfMonth.toISOString())
      .in('status', ['completed', 'approved', 'processing', 'pending'])
    
    if (monthlyWithdrawalError) throw monthlyWithdrawalError
    
    const monthlyWithdrawalFees = monthlyWithdrawalData?.reduce((sum: number, record: { withdrawal_fee: number }) => sum + Number(record.withdrawal_fee), 0) || 0
    
    // Get previous month withdrawal fees for growth calculation
    const { data: previousWithdrawalData, error: previousWithdrawalError } = await supabase
      .from('payout_requests')
      .select('withdrawal_fee')
      .gte('created_at', previousMonth.toISOString())
      .lte('created_at', lastDayOfPreviousMonth.toISOString())
      .in('status', ['completed', 'approved', 'processing', 'pending'])
    
    if (previousWithdrawalError) throw previousWithdrawalError
    
    const previousMonthWithdrawalFees = previousWithdrawalData?.reduce((sum: number, record: { withdrawal_fee: number }) => sum + Number(record.withdrawal_fee), 0) || 0
    const withdrawalFeeGrowth = previousMonthWithdrawalFees > 0 ? ((monthlyWithdrawalFees - previousMonthWithdrawalFees) / previousMonthWithdrawalFees) * 100 : 0
    
    return {
      totalRevenue,
      monthlyRevenue,
      averageCommissionPerBooking,
      totalBookings,
      monthlyGrowth,
      availableBalance,
      outstandingLiabilities,
      netCashPosition,
      totalWithdrawalFees,
      monthlyWithdrawalFees,
      withdrawalFeeGrowth,
      totalWithdrawalRequests
    }
  } catch (error) {
    console.error('Error fetching revenue metrics:', error)
    throw new Error('Failed to fetch revenue metrics')
  }
}

export async function getDailyRevenue(days: number = 30): Promise<DailyRevenue[]> {
  const supabase = createSupabaseServerClient()
  
  try {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)
    
    // Get earnings data
    const { data, error } = await supabase
      .from('earnings')
      .select('created_at, platform_fee, booking_total')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Get withdrawal fee data
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('payout_requests')
      .select('created_at, withdrawal_fee')
      .gte('created_at', daysAgo.toISOString())
      .in('status', ['completed', 'approved', 'processing', 'pending'])
      .order('created_at', { ascending: true })
    
    if (withdrawalError) throw withdrawalError
    
    // Group by date
    const dailyData = new Map<string, {
      bookings: number
      grossRevenue: number
      commission: number
      withdrawalFees: number
      withdrawalRequests: number
    }>()
    
    // Process earnings data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((record: any) => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      const existing = dailyData.get(date) || { bookings: 0, grossRevenue: 0, commission: 0, withdrawalFees: 0, withdrawalRequests: 0 }
      
      dailyData.set(date, {
        bookings: existing.bookings + 1,
        grossRevenue: existing.grossRevenue + Number(record.booking_total),
        commission: existing.commission + Number(record.platform_fee),
        withdrawalFees: existing.withdrawalFees,
        withdrawalRequests: existing.withdrawalRequests
      })
    })
    
    // Process withdrawal data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withdrawalData?.forEach((record: any) => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      const existing = dailyData.get(date) || { bookings: 0, grossRevenue: 0, commission: 0, withdrawalFees: 0, withdrawalRequests: 0 }
      
      dailyData.set(date, {
        bookings: existing.bookings,
        grossRevenue: existing.grossRevenue,
        commission: existing.commission,
        withdrawalFees: existing.withdrawalFees + Number(record.withdrawal_fee),
        withdrawalRequests: existing.withdrawalRequests + 1
      })
    })
    
    // Convert to array and calculate averages
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      bookings: data.bookings,
      grossRevenue: data.grossRevenue,
      commission: data.commission,
      averageCommission: data.bookings > 0 ? data.commission / data.bookings : 0,
      withdrawalFees: data.withdrawalFees,
      withdrawalRequests: data.withdrawalRequests
    }))
  } catch (error) {
    console.error('Error fetching daily revenue:', error)
    throw new Error('Failed to fetch daily revenue data')
  }
}

export async function getTopWashers(limit: number = 10): Promise<TopWasher[]> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Get last 30 days data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data, error } = await supabase
      .from('earnings')
      .select(`
        platform_fee,
        booking_total,
        washer_id,
        profiles!inner(first_name, last_name)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    if (error) throw error
    
    // Group by washer
    const washerData = new Map<string, {
      washerName: string
      bookingsCompleted: number
      commissionGenerated: number
      totalBookingValue: number
    }>()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((record: any) => {
      const washerName = `${record.profiles?.first_name || ''} ${record.profiles?.last_name || ''}`.trim() || 'Unknown'
      const existing = washerData.get(record.washer_id) || {
        washerName,
        bookingsCompleted: 0,
        commissionGenerated: 0,
        totalBookingValue: 0
      }
      
      washerData.set(record.washer_id, {
        washerName,
        bookingsCompleted: existing.bookingsCompleted + 1,
        commissionGenerated: existing.commissionGenerated + Number(record.platform_fee),
        totalBookingValue: existing.totalBookingValue + Number(record.booking_total)
      })
    })
    
    // Convert to array, calculate averages, and sort by commission
    return Array.from(washerData.values())
      .map(washer => ({
        ...washer,
        averageBookingValue: washer.bookingsCompleted > 0 ? washer.totalBookingValue / washer.bookingsCompleted : 0
      }))
      .sort((a, b) => b.commissionGenerated - a.commissionGenerated)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching top washers:', error)
    throw new Error('Failed to fetch top washers data')
  }
}

export async function getMonthlyGrowthData(months: number = 12): Promise<MonthlyGrowth[]> {
  const supabase = createSupabaseServerClient()
  
  try {
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - months)
    
    const { data, error } = await supabase
      .from('earnings')
      .select('created_at, platform_fee')
      .gte('created_at', monthsAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Group by month
    const monthlyData = new Map<string, number>()
    
    data?.forEach((record: Record<string, any>) => {
      const date = new Date(record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyData.get(monthKey) || 0
      monthlyData.set(monthKey, existing + Number(record.platform_fee))
    })
    
    // Convert to array with growth calculations
    const sortedMonths = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
    
    return sortedMonths.map(([monthKey, commission], index) => {
      const [year, month] = monthKey.split('-').map(Number)
      const previousMonth = index > 0 ? sortedMonths[index - 1][1] : null
      const growthPercentage = previousMonth ? ((commission - previousMonth) / previousMonth) * 100 : null
      
      return {
        year,
        month,
        monthlyCommission: commission,
        previousMonth,
        growthPercentage
      }
    })
  } catch (error) {
    console.error('Error fetching monthly growth data:', error)
    throw new Error('Failed to fetch monthly growth data')
  }
} 
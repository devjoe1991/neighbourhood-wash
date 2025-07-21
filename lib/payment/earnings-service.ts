import { createSupabaseServerClient } from '@/utils/supabase/server'
import { paymentService } from './payment-service'

export interface EarningsCalculation {
  grossEarnings: number
  platformFees: number
  netEarnings: number
  jobsCompleted: number
  totalHoursWorked: number
  averageHourlyRate: number
}

export interface EarningsPeriod {
  id: string
  washerId: string
  periodStart: string
  periodEnd: string
  grossEarnings: number
  platformFees: number
  netEarnings: number
  jobsCompleted: number
  totalHoursWorked: number
  averageHourlyRate: number
  payoutStatus: 'pending' | 'processing' | 'paid' | 'failed'
  payoutDate?: string
  createdAt: string
}

export interface PayoutRequest {
  id: string
  washerId: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  processedAt?: string
  failureReason?: string
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
}

export class EarningsService {
  private supabase = createSupabaseServerClient()
  private readonly PLATFORM_FEE_RATE = 0.15 // 15% platform fee

  /**
   * Calculates earnings for a washer for a specific period
   */
  async calculateEarnings(
    washerId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<EarningsCalculation>> {
    try {
      // Get completed bookings for the period
      const { data: bookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          estimated_duration_hours,
          completed_at,
          washer_id
        `)
        .eq('washer_id', washerId)
        .eq('status', 'completed')
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)

      if (bookingsError) {
        throw bookingsError
      }

      if (!bookings || bookings.length === 0) {
        return {
          success: true,
          data: {
            grossEarnings: 0,
            platformFees: 0,
            netEarnings: 0,
            jobsCompleted: 0,
            totalHoursWorked: 0,
            averageHourlyRate: 0
          }
        }
      }

      // Calculate totals
      const grossEarnings = bookings.reduce((sum, booking) => sum + booking.total_price, 0)
      const platformFees = grossEarnings * this.PLATFORM_FEE_RATE
      const netEarnings = grossEarnings - platformFees
      const jobsCompleted = bookings.length
      const totalHoursWorked = bookings.reduce((sum, booking) => 
        sum + (booking.estimated_duration_hours || 0), 0
      )
      const averageHourlyRate = totalHoursWorked > 0 ? netEarnings / totalHoursWorked : 0

      return {
        success: true,
        data: {
          grossEarnings,
          platformFees,
          netEarnings,
          jobsCompleted,
          totalHoursWorked,
          averageHourlyRate
        }
      }
    } catch (error) {
      console.error('Error calculating earnings:', error)
      return {
        success: false,
        error: {
          message: 'Failed to calculate earnings',
          details: error
        }
      }
    }
  }

  /**
   * Creates or updates earnings record for a period
   */
  async createEarningsPeriod(
    washerId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<EarningsPeriod>> {
    try {
      // Calculate earnings for the period
      const earningsResult = await this.calculateEarnings(washerId, startDate, endDate)
      
      if (!earningsResult.success || !earningsResult.data) {
        return {
          success: false,
          error: { message: 'Failed to calculate earnings for period' }
        }
      }

      const earnings = earningsResult.data

      // Check if earnings period already exists
      const { data: existingPeriod, error: checkError } = await this.supabase
        .from('washer_earnings')
        .select('id')
        .eq('washer_id', washerId)
        .eq('period_start', startDate)
        .eq('period_end', endDate)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError
      }

      let earningsPeriod: any

      if (existingPeriod) {
        // Update existing period
        const { data: updated, error: updateError } = await this.supabase
          .from('washer_earnings')
          .update({
            gross_earnings: earnings.grossEarnings,
            platform_fees: earnings.platformFees,
            net_earnings: earnings.netEarnings,
            jobs_completed: earnings.jobsCompleted,
            total_hours_worked: earnings.totalHoursWorked,
            average_hourly_rate: earnings.averageHourlyRate
          })
          .eq('id', existingPeriod.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        earningsPeriod = updated
      } else {
        // Create new period
        const { data: created, error: createError } = await this.supabase
          .from('washer_earnings')
          .insert({
            washer_id: washerId,
            period_start: startDate,
            period_end: endDate,
            gross_earnings: earnings.grossEarnings,
            platform_fees: earnings.platformFees,
            net_earnings: earnings.netEarnings,
            jobs_completed: earnings.jobsCompleted,
            total_hours_worked: earnings.totalHoursWorked,
            average_hourly_rate: earnings.averageHourlyRate,
            payout_status: 'pending'
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        earningsPeriod = created
      }

      return {
        success: true,
        data: {
          id: earningsPeriod.id,
          washerId: earningsPeriod.washer_id,
          periodStart: earningsPeriod.period_start,
          periodEnd: earningsPeriod.period_end,
          grossEarnings: earningsPeriod.gross_earnings,
          platformFees: earningsPeriod.platform_fees,
          netEarnings: earningsPeriod.net_earnings,
          jobsCompleted: earningsPeriod.jobs_completed,
          totalHoursWorked: earningsPeriod.total_hours_worked,
          averageHourlyRate: earningsPeriod.average_hourly_rate,
          payoutStatus: earningsPeriod.payout_status,
          payoutDate: earningsPeriod.payout_date,
          createdAt: earningsPeriod.created_at
        }
      }
    } catch (error) {
      console.error('Error creating earnings period:', error)
      return {
        success: false,
        error: {
          message: 'Failed to create earnings period',
          details: error
        }
      }
    }
  }

  /**
   * Gets earnings history for a washer
   */
  async getEarningsHistory(
    washerId: string,
    limit: number = 12
  ): Promise<ServiceResult<EarningsPeriod[]>> {
    try {
      const { data: earnings, error } = await this.supabase
        .from('washer_earnings')
        .select('*')
        .eq('washer_id', washerId)
        .order('period_end', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      const earningsPeriods: EarningsPeriod[] = (earnings || []).map(period => ({
        id: period.id,
        washerId: period.washer_id,
        periodStart: period.period_start,
        periodEnd: period.period_end,
        grossEarnings: period.gross_earnings,
        platformFees: period.platform_fees,
        netEarnings: period.net_earnings,
        jobsCompleted: period.jobs_completed,
        totalHoursWorked: period.total_hours_worked,
        averageHourlyRate: period.average_hourly_rate,
        payoutStatus: period.payout_status,
        payoutDate: period.payout_date,
        createdAt: period.created_at
      }))

      return {
        success: true,
        data: earningsPeriods
      }
    } catch (error) {
      console.error('Error fetching earnings history:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch earnings history',
          details: error
        }
      }
    }
  }

  /**
   * Gets pending earnings for a washer
   */
  async getPendingEarnings(washerId: string): Promise<ServiceResult<number>> {
    try {
      const { data: pendingEarnings, error } = await this.supabase
        .from('washer_earnings')
        .select('net_earnings')
        .eq('washer_id', washerId)
        .eq('payout_status', 'pending')

      if (error) {
        throw error
      }

      const totalPending = (pendingEarnings || []).reduce(
        (sum, earning) => sum + earning.net_earnings, 
        0
      )

      return {
        success: true,
        data: totalPending
      }
    } catch (error) {
      console.error('Error fetching pending earnings:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch pending earnings',
          details: error
        }
      }
    }
  }

  /**
   * Requests a payout for pending earnings
   */
  async requestPayout(washerId: string): Promise<ServiceResult<PayoutRequest>> {
    try {
      // Get pending earnings
      const pendingResult = await this.getPendingEarnings(washerId)
      
      if (!pendingResult.success || !pendingResult.data || pendingResult.data <= 0) {
        return {
          success: false,
          error: { message: 'No pending earnings available for payout' }
        }
      }

      const pendingAmount = pendingResult.data

      // Get washer profile to check Stripe account
      const { data: washerProfile, error: washerError } = await this.supabase
        .from('washer_profiles')
        .select('user_id, stripe_account_id')
        .eq('id', washerId)
        .single()

      if (washerError || !washerProfile) {
        return {
          success: false,
          error: { message: 'Washer profile not found' }
        }
      }

      if (!washerProfile.stripe_account_id) {
        return {
          success: false,
          error: { message: 'No payment account connected. Please complete onboarding.' }
        }
      }

      // Process payout through payment service
      const payoutResult = await paymentService.processPayout(
        washerId,
        pendingAmount,
        `Earnings payout for washer ${washerId}`
      )

      if (!payoutResult.success) {
        return {
          success: false,
          error: payoutResult.error
        }
      }

      // Update earnings periods to mark as paid
      const { error: updateError } = await this.supabase
        .from('washer_earnings')
        .update({
          payout_status: 'paid',
          payout_date: new Date().toISOString().split('T')[0]
        })
        .eq('washer_id', washerId)
        .eq('payout_status', 'pending')

      if (updateError) {
        console.error('Error updating earnings payout status:', updateError)
        // Don't fail the request since payout was successful
      }

      return {
        success: true,
        data: {
          id: payoutResult.data!.id,
          washerId,
          amount: pendingAmount,
          status: 'completed',
          requestedAt: new Date().toISOString(),
          processedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      return {
        success: false,
        error: {
          message: 'Failed to process payout request',
          details: error
        }
      }
    }
  }

  /**
   * Automatically calculates and creates earnings periods for all washers
   * This would typically be run as a scheduled job
   */
  async processPeriodicEarnings(
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<{ processed: number; errors: number }>> {
    try {
      // Get all active washers
      const { data: washers, error: washersError } = await this.supabase
        .from('washer_profiles')
        .select('id')
        .eq('approval_status', 'approved')

      if (washersError) {
        throw washersError
      }

      let processed = 0
      let errors = 0

      // Process earnings for each washer
      for (const washer of washers || []) {
        try {
          await this.createEarningsPeriod(washer.id, startDate, endDate)
          processed++
        } catch (error) {
          console.error(`Error processing earnings for washer ${washer.id}:`, error)
          errors++
        }
      }

      return {
        success: true,
        data: { processed, errors }
      }
    } catch (error) {
      console.error('Error processing periodic earnings:', error)
      return {
        success: false,
        error: {
          message: 'Failed to process periodic earnings',
          details: error
        }
      }
    }
  }
}

export const earningsService = new EarningsService()
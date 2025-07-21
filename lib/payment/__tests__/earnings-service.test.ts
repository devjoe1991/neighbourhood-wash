import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { EarningsService } from '../earnings-service'

// Mock dependencies
vi.mock('@/utils/supabase/server')
vi.mock('../payment-service', () => ({
  paymentService: {
    processPayout: vi.fn()
  }
}))

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { paymentService } from '../payment-service'

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
}

;(createSupabaseServerClient as Mock).mockReturnValue(mockSupabase)

describe('EarningsService', () => {
  let earningsService: EarningsService

  beforeEach(() => {
    vi.clearAllMocks()
    earningsService = new EarningsService()
  })

  describe('calculateEarnings', () => {
    it('should calculate earnings correctly', async () => {
      const mockBookings = [
        {
          id: 'booking_1',
          total_price: 50.00,
          estimated_duration_hours: 2.0,
          completed_at: '2025-01-15T10:00:00Z',
          washer_id: 'washer_123'
        },
        {
          id: 'booking_2',
          total_price: 30.00,
          estimated_duration_hours: 1.5,
          completed_at: '2025-01-16T10:00:00Z',
          washer_id: 'washer_123'
        }
      ]

      mockSupabase.from().select().eq().gte().lte.mockResolvedValue({
        data: mockBookings,
        error: null
      })

      const result = await earningsService.calculateEarnings(
        'washer_123',
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        grossEarnings: 80.00,
        platformFees: 12.00, // 15% of 80
        netEarnings: 68.00,
        jobsCompleted: 2,
        totalHoursWorked: 3.5,
        averageHourlyRate: 68.00 / 3.5 // ~19.43
      })
    })

    it('should return zero earnings for no bookings', async () => {
      mockSupabase.from().select().eq().gte().lte.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await earningsService.calculateEarnings(
        'washer_123',
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        grossEarnings: 0,
        platformFees: 0,
        netEarnings: 0,
        jobsCompleted: 0,
        totalHoursWorked: 0,
        averageHourlyRate: 0
      })
    })

    it('should handle database errors', async () => {
      mockSupabase.from().select().eq().gte().lte.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await earningsService.calculateEarnings(
        'washer_123',
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to calculate earnings')
    })
  })

  describe('createEarningsPeriod', () => {
    it('should create new earnings period', async () => {
      // Mock calculateEarnings
      vi.spyOn(earningsService, 'calculateEarnings').mockResolvedValue({
        success: true,
        data: {
          grossEarnings: 80.00,
          platformFees: 12.00,
          netEarnings: 68.00,
          jobsCompleted: 2,
          totalHoursWorked: 3.5,
          averageHourlyRate: 19.43
        }
      })

      // Mock no existing period
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      })

      const mockEarningsPeriod = {
        id: 'earnings_123',
        washer_id: 'washer_123',
        period_start: '2025-01-01',
        period_end: '2025-01-31',
        gross_earnings: 80.00,
        platform_fees: 12.00,
        net_earnings: 68.00,
        jobs_completed: 2,
        total_hours_worked: 3.5,
        average_hourly_rate: 19.43,
        payout_status: 'pending',
        created_at: '2025-01-20T10:00:00Z'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockEarningsPeriod,
        error: null
      })

      const result = await earningsService.createEarningsPeriod(
        'washer_123',
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'earnings_123',
        washerId: 'washer_123',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        grossEarnings: 80.00,
        platformFees: 12.00,
        netEarnings: 68.00,
        jobsCompleted: 2,
        totalHoursWorked: 3.5,
        averageHourlyRate: 19.43,
        payoutStatus: 'pending',
        payoutDate: undefined,
        createdAt: '2025-01-20T10:00:00Z'
      })
    })

    it('should update existing earnings period', async () => {
      // Mock calculateEarnings
      vi.spyOn(earningsService, 'calculateEarnings').mockResolvedValue({
        success: true,
        data: {
          grossEarnings: 100.00,
          platformFees: 15.00,
          netEarnings: 85.00,
          jobsCompleted: 3,
          totalHoursWorked: 4.0,
          averageHourlyRate: 21.25
        }
      })

      // Mock existing period
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'earnings_123' },
        error: null
      })

      const mockUpdatedPeriod = {
        id: 'earnings_123',
        washer_id: 'washer_123',
        period_start: '2025-01-01',
        period_end: '2025-01-31',
        gross_earnings: 100.00,
        platform_fees: 15.00,
        net_earnings: 85.00,
        jobs_completed: 3,
        total_hours_worked: 4.0,
        average_hourly_rate: 21.25,
        payout_status: 'pending',
        created_at: '2025-01-20T10:00:00Z'
      }

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedPeriod,
        error: null
      })

      const result = await earningsService.createEarningsPeriod(
        'washer_123',
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data?.grossEarnings).toBe(100.00)
    })
  })

  describe('getPendingEarnings', () => {
    it('should calculate pending earnings correctly', async () => {
      const mockPendingEarnings = [
        { net_earnings: 68.00 },
        { net_earnings: 45.50 },
        { net_earnings: 32.25 }
      ]

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockPendingEarnings,
        error: null
      })

      const result = await earningsService.getPendingEarnings('washer_123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(145.75) // Sum of all pending earnings
    })

    it('should return zero for no pending earnings', async () => {
      mockSupabase.from().select().eq().mockResolvedValue({
        data: [],
        error: null
      })

      const result = await earningsService.getPendingEarnings('washer_123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(0)
    })
  })

  describe('requestPayout', () => {
    it('should process payout request successfully', async () => {
      // Mock pending earnings
      vi.spyOn(earningsService, 'getPendingEarnings').mockResolvedValue({
        success: true,
        data: 145.75
      })

      // Mock washer profile
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          user_id: 'user_123',
          stripe_account_id: 'acct_123'
        },
        error: null
      })

      // Mock payment service payout
      ;(paymentService.processPayout as Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'payout_123',
          amount: 145.75,
          status: 'completed',
          createdAt: '2025-01-20T10:00:00Z'
        }
      })

      // Mock earnings update
      mockSupabase.from().update().eq().mockResolvedValue({
        error: null
      })

      const result = await earningsService.requestPayout('washer_123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'payout_123',
        washerId: 'washer_123',
        amount: 145.75,
        status: 'completed',
        requestedAt: expect.any(String),
        processedAt: expect.any(String)
      })

      expect(paymentService.processPayout).toHaveBeenCalledWith(
        'washer_123',
        145.75,
        'Earnings payout for washer washer_123'
      )
    })

    it('should fail if no pending earnings', async () => {
      vi.spyOn(earningsService, 'getPendingEarnings').mockResolvedValue({
        success: true,
        data: 0
      })

      const result = await earningsService.requestPayout('washer_123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('No pending earnings available for payout')
    })

    it('should fail if no Stripe account connected', async () => {
      vi.spyOn(earningsService, 'getPendingEarnings').mockResolvedValue({
        success: true,
        data: 145.75
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          user_id: 'user_123',
          stripe_account_id: null
        },
        error: null
      })

      const result = await earningsService.requestPayout('washer_123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('No payment account connected. Please complete onboarding.')
    })
  })

  describe('processPeriodicEarnings', () => {
    it('should process earnings for all washers', async () => {
      const mockWashers = [
        { id: 'washer_1' },
        { id: 'washer_2' },
        { id: 'washer_3' }
      ]

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockWashers,
        error: null
      })

      // Mock successful earnings creation
      vi.spyOn(earningsService, 'createEarningsPeriod').mockResolvedValue({
        success: true,
        data: {} as any
      })

      const result = await earningsService.processPeriodicEarnings(
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        processed: 3,
        errors: 0
      })

      expect(earningsService.createEarningsPeriod).toHaveBeenCalledTimes(3)
    })

    it('should handle errors gracefully', async () => {
      const mockWashers = [
        { id: 'washer_1' },
        { id: 'washer_2' }
      ]

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockWashers,
        error: null
      })

      // Mock one success, one failure
      vi.spyOn(earningsService, 'createEarningsPeriod')
        .mockResolvedValueOnce({
          success: true,
          data: {} as any
        })
        .mockRejectedValueOnce(new Error('Processing failed'))

      const result = await earningsService.processPeriodicEarnings(
        '2025-01-01',
        '2025-01-31'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        processed: 1,
        errors: 1
      })
    })
  })
})
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { PaymentService } from '../payment-service'

// Mock dependencies
vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn()
    },
    refunds: {
      create: vi.fn()
    },
    transfers: {
      create: vi.fn()
    }
  }
}))

vi.mock('@/utils/supabase/server')

import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

const mockStripe = stripe as any
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn()
  }))
}

;(createSupabaseServerClient as Mock).mockReturnValue(mockSupabase)

describe('PaymentService', () => {
  let paymentService: PaymentService

  beforeEach(() => {
    vi.clearAllMocks()
    paymentService = new PaymentService()
  })

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      // Mock booking data
      const mockBooking = {
        id: 'booking_123',
        customer_id: 'customer_123',
        total_price: 50.00,
        payment_status: 'pending'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockBooking,
        error: null
      })

      // Mock Stripe payment intent
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        amount: 5000,
        currency: 'gbp',
        status: 'requires_payment_method'
      }

      mockStripe.paymentIntents = {
        create: vi.fn().mockResolvedValue(mockPaymentIntent)
      }

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await paymentService.createPaymentIntent(
        'booking_123',
        50.00,
        'customer_123'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'pi_123',
        clientSecret: 'pi_123_secret',
        amount: 50.00,
        currency: 'gbp',
        status: 'requires_payment_method'
      })

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'gbp',
        metadata: {
          bookingId: 'booking_123',
          customerId: 'customer_123'
        },
        automatic_payment_methods: {
          enabled: true
        }
      })
    })

    it('should fail if booking not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await paymentService.createPaymentIntent(
        'booking_123',
        50.00,
        'customer_123'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Booking not found')
    })

    it('should fail if customer does not own booking', async () => {
      const mockBooking = {
        id: 'booking_123',
        customer_id: 'different_customer',
        total_price: 50.00,
        payment_status: 'pending'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockBooking,
        error: null
      })

      const result = await paymentService.createPaymentIntent(
        'booking_123',
        50.00,
        'customer_123'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Unauthorized access to booking')
    })

    it('should fail if booking already paid', async () => {
      const mockBooking = {
        id: 'booking_123',
        customer_id: 'customer_123',
        total_price: 50.00,
        payment_status: 'captured'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockBooking,
        error: null
      })

      const result = await paymentService.createPaymentIntent(
        'booking_123',
        50.00,
        'customer_123'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Booking already paid')
    })
  })

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'gbp',
        metadata: {
          bookingId: 'booking_123',
          customerId: 'customer_123'
        }
      }

      mockStripe.paymentIntents = {
        retrieve: vi.fn().mockResolvedValue(mockPaymentIntent)
      }

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const mockTransaction = {
        id: 'trans_123',
        amount: 50.00,
        currency: 'gbp',
        status: 'completed',
        created_at: '2025-01-20T10:00:00Z'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      })

      const result = await paymentService.confirmPayment('pi_123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'trans_123',
        amount: 50.00,
        currency: 'gbp',
        status: 'completed',
        paymentIntentId: 'pi_123',
        bookingId: 'booking_123',
        customerId: 'customer_123',
        createdAt: '2025-01-20T10:00:00Z'
      })
    })

    it('should fail if payment not successful', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'requires_payment_method',
        metadata: {}
      }

      mockStripe.paymentIntents = {
        retrieve: vi.fn().mockResolvedValue(mockPaymentIntent)
      }

      const result = await paymentService.confirmPayment('pi_123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Payment not successful')
    })
  })

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const mockTransaction = {
        id: 'trans_123',
        amount: 50.00,
        stripe_payment_intent_id: 'pi_123',
        booking_id: 'booking_123',
        user_id: 'customer_123'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      })

      const mockRefund = {
        id: 'ref_123',
        amount: 5000,
        currency: 'gbp',
        status: 'succeeded'
      }

      mockStripe.refunds = {
        create: vi.fn().mockResolvedValue(mockRefund)
      }

      const mockRefundTransaction = {
        id: 'trans_refund_123',
        amount: -50.00,
        currency: 'gbp',
        status: 'completed',
        created_at: '2025-01-20T10:00:00Z'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockRefundTransaction,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await paymentService.refundPayment('trans_123', 50.00, 'Customer request')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'trans_refund_123',
        amount: 50.00,
        currency: 'gbp',
        status: 'completed',
        paymentId: 'trans_123',
        reason: 'Customer request',
        createdAt: '2025-01-20T10:00:00Z'
      })

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 5000,
        reason: 'Customer request',
        metadata: {
          originalTransactionId: 'trans_123',
          bookingId: 'booking_123'
        }
      })
    })

    it('should fail if original payment not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await paymentService.refundPayment('trans_123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Original payment not found')
    })
  })

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockWasherProfile = {
        user_id: 'washer_123',
        stripe_account_id: 'acct_123'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWasherProfile,
        error: null
      })

      const mockTransfer = {
        id: 'tr_123',
        amount: 4250,
        currency: 'gbp',
        destination: 'acct_123'
      }

      mockStripe.transfers = {
        create: vi.fn().mockResolvedValue(mockTransfer)
      }

      const mockPayoutTransaction = {
        id: 'trans_payout_123',
        amount: 42.50,
        currency: 'gbp',
        status: 'completed',
        created_at: '2025-01-20T10:00:00Z'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockPayoutTransaction,
        error: null
      })

      const result = await paymentService.processPayout('washer_123', 42.50, 'Weekly payout')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'trans_payout_123',
        amount: 42.50,
        currency: 'gbp',
        status: 'completed',
        washerId: 'washer_123',
        stripeTransferId: 'tr_123',
        createdAt: '2025-01-20T10:00:00Z'
      })

      expect(mockStripe.transfers.create).toHaveBeenCalledWith({
        amount: 4250,
        currency: 'gbp',
        destination: 'acct_123',
        metadata: {
          washerId: 'washer_123',
          description: 'Weekly payout'
        }
      })
    })

    it('should fail if washer has no Stripe account', async () => {
      const mockWasherProfile = {
        user_id: 'washer_123',
        stripe_account_id: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWasherProfile,
        error: null
      })

      const result = await paymentService.processPayout('washer_123', 42.50)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Washer has no connected Stripe account')
    })
  })

  describe('getTransactionHistory', () => {
    it('should fetch transaction history successfully', async () => {
      const mockTransactions = [
        {
          id: 'trans_1',
          amount: 50.00,
          type: 'payment',
          status: 'completed',
          created_at: '2025-01-20T10:00:00Z'
        },
        {
          id: 'trans_2',
          amount: 42.50,
          type: 'payout',
          status: 'completed',
          created_at: '2025-01-19T10:00:00Z'
        }
      ]

      const mockQuery = {
        eq: vi.fn(() => mockQuery),
        gte: vi.fn(() => mockQuery),
        lte: vi.fn(() => mockQuery),
        order: vi.fn(() => mockQuery),
        limit: vi.fn(() => mockQuery),
        range: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
      }

      mockSupabase.from().select.mockReturnValue(mockQuery)

      const result = await paymentService.getTransactionHistory('user_123', {
        type: 'payment',
        limit: 10,
        offset: 0
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTransactions)
    })
  })
})
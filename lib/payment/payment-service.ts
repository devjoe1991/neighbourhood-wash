import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentIntentId: string
  bookingId: string
  customerId: string
  createdAt: string
}

export interface Refund {
  id: string
  amount: number
  currency: string
  status: string
  paymentId: string
  reason?: string
  createdAt: string
}

export interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  washerId: string
  stripeTransferId?: string
  createdAt: string
}

export interface Transaction {
  id: string
  bookingId?: string
  userId: string
  type: 'payment' | 'payout' | 'fee' | 'refund' | 'adjustment'
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  description?: string
  stripePaymentIntentId?: string
  stripeTransferId?: string
  processedAt?: string
  createdAt: string
}

export interface TransactionFilters {
  type?: Transaction['type']
  status?: Transaction['status']
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface FinancialReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalRevenue: number
    totalPayouts: number
    platformFees: number
    netRevenue: number
    transactionCount: number
  }
  breakdown: {
    payments: number
    payouts: number
    refunds: number
    fees: number
  }
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

export class PaymentService {
  private supabase = createSupabaseServerClient()

  /**
   * Creates a payment intent for a booking
   */
  async createPaymentIntent(
    bookingId: string, 
    amount: number, 
    customerId: string
  ): Promise<ServiceResult<PaymentIntent>> {
    try {
      // Validate booking exists and belongs to customer
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .select('id, customer_id, total_price, payment_status')
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        return {
          success: false,
          error: { message: 'Booking not found' }
        }
      }

      if (booking.customer_id !== customerId) {
        return {
          success: false,
          error: { message: 'Unauthorized access to booking' }
        }
      }

      if (booking.payment_status === 'captured') {
        return {
          success: false,
          error: { message: 'Booking already paid' }
        }
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: 'gbp',
        metadata: {
          bookingId,
          customerId
        },
        automatic_payment_methods: {
          enabled: true
        }
      })

      // Update booking with payment intent ID
      await this.supabase
        .from('bookings')
        .update({ 
          payment_intent_id: paymentIntent.id,
          payment_status: 'pending'
        })
        .eq('id', bookingId)

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret!,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to create payment intent',
          details: error
        }
      }
    }
  }

  /**
   * Confirms a payment and creates transaction record
   */
  async confirmPayment(paymentIntentId: string): Promise<ServiceResult<Payment>> {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: { message: 'Payment not successful' }
        }
      }

      const bookingId = paymentIntent.metadata.bookingId
      const customerId = paymentIntent.metadata.customerId

      // Update booking status
      const { error: bookingError } = await this.supabase
        .from('bookings')
        .update({ 
          payment_status: 'captured',
          status: 'confirmed'
        })
        .eq('id', bookingId)

      if (bookingError) {
        throw new Error('Failed to update booking status')
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from('transactions')
        .insert({
          booking_id: bookingId,
          user_id: customerId,
          type: 'payment',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'completed',
          stripe_payment_intent_id: paymentIntentId,
          description: `Payment for booking ${bookingId}`,
          processed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error('Failed to create transaction record')
      }

      return {
        success: true,
        data: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          paymentIntentId,
          bookingId,
          customerId,
          createdAt: transaction.created_at
        }
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to confirm payment',
          details: error
        }
      }
    }
  }

  /**
   * Processes a refund for a payment
   */
  async refundPayment(
    paymentId: string, 
    amount?: number, 
    reason?: string
  ): Promise<ServiceResult<Refund>> {
    try {
      // Get original transaction
      const { data: originalTransaction, error: transactionError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', paymentId)
        .eq('type', 'payment')
        .single()

      if (transactionError || !originalTransaction) {
        return {
          success: false,
          error: { message: 'Original payment not found' }
        }
      }

      if (!originalTransaction.stripe_payment_intent_id) {
        return {
          success: false,
          error: { message: 'No Stripe payment intent found' }
        }
      }

      // Create refund in Stripe
      const refundAmount = amount ? Math.round(amount * 100) : undefined
      const stripeRefund = await stripe.refunds.create({
        payment_intent: originalTransaction.stripe_payment_intent_id,
        amount: refundAmount,
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          originalTransactionId: paymentId,
          bookingId: originalTransaction.booking_id
        }
      })

      // Create refund transaction record
      const { data: refundTransaction, error: refundError } = await this.supabase
        .from('transactions')
        .insert({
          booking_id: originalTransaction.booking_id,
          user_id: originalTransaction.user_id,
          type: 'refund',
          amount: -(stripeRefund.amount / 100), // Negative amount for refund
          currency: stripeRefund.currency,
          status: stripeRefund.status === 'succeeded' ? 'completed' : 'pending',
          description: `Refund for payment ${paymentId}${reason ? ` - ${reason}` : ''}`,
          processed_at: stripeRefund.status === 'succeeded' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (refundError) {
        throw new Error('Failed to create refund record')
      }

      // Update booking status if full refund
      if (!amount || amount >= originalTransaction.amount) {
        await this.supabase
          .from('bookings')
          .update({ 
            payment_status: 'refunded',
            status: 'cancelled'
          })
          .eq('id', originalTransaction.booking_id)
      }

      return {
        success: true,
        data: {
          id: refundTransaction.id,
          amount: Math.abs(refundTransaction.amount),
          currency: refundTransaction.currency,
          status: refundTransaction.status,
          paymentId,
          reason,
          createdAt: refundTransaction.created_at
        }
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to process refund',
          details: error
        }
      }
    }
  }

  /**
   * Processes a payout to a washer
   */
  async processPayout(
    washerId: string, 
    amount: number,
    description?: string
  ): Promise<ServiceResult<Payout>> {
    try {
      // Get washer's Stripe account
      const { data: washerProfile, error: washerError } = await this.supabase
        .from('washer_profiles')
        .select('user_id, stripe_account_id')
        .eq('id', washerId)
        .single()

      if (washerError || !washerProfile) {
        return {
          success: false,
          error: { message: 'Washer not found' }
        }
      }

      if (!washerProfile.stripe_account_id) {
        return {
          success: false,
          error: { message: 'Washer has no connected Stripe account' }
        }
      }

      // Create transfer in Stripe
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: 'gbp',
        destination: washerProfile.stripe_account_id,
        metadata: {
          washerId,
          description: description || `Payout to washer ${washerId}`
        }
      })

      // Create payout transaction record
      const { data: payoutTransaction, error: payoutError } = await this.supabase
        .from('transactions')
        .insert({
          user_id: washerProfile.user_id,
          type: 'payout',
          amount,
          currency: 'gbp',
          status: 'completed',
          stripe_transfer_id: transfer.id,
          description: description || `Payout to washer ${washerId}`,
          processed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (payoutError) {
        throw new Error('Failed to create payout record')
      }

      return {
        success: true,
        data: {
          id: payoutTransaction.id,
          amount: payoutTransaction.amount,
          currency: payoutTransaction.currency,
          status: payoutTransaction.status,
          washerId,
          stripeTransferId: transfer.id,
          createdAt: payoutTransaction.created_at
        }
      }
    } catch (error) {
      console.error('Error processing payout:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to process payout',
          details: error
        }
      }
    }
  }

  /**
   * Gets transaction history for a user
   */
  async getTransactionHistory(
    userId: string, 
    filters?: TransactionFilters
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      let query = this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50)

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data: transactions, error } = await query

      if (error) {
        throw error
      }

      return {
        success: true,
        data: transactions || []
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to fetch transaction history',
          details: error
        }
      }
    }
  }

  /**
   * Generates a financial report for a given period
   */
  async generateFinancialReport(
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<FinancialReport>> {
    try {
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('type, amount, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed')

      if (error) {
        throw error
      }

      const summary = {
        totalRevenue: 0,
        totalPayouts: 0,
        platformFees: 0,
        netRevenue: 0,
        transactionCount: transactions?.length || 0
      }

      const breakdown = {
        payments: 0,
        payouts: 0,
        refunds: 0,
        fees: 0
      }

      transactions?.forEach(transaction => {
        switch (transaction.type) {
          case 'payment':
            summary.totalRevenue += transaction.amount
            breakdown.payments += transaction.amount
            break
          case 'payout':
            summary.totalPayouts += transaction.amount
            breakdown.payouts += transaction.amount
            break
          case 'refund':
            summary.totalRevenue += transaction.amount // Refunds are negative
            breakdown.refunds += Math.abs(transaction.amount)
            break
          case 'fee':
            summary.platformFees += transaction.amount
            breakdown.fees += transaction.amount
            break
        }
      })

      summary.netRevenue = summary.totalRevenue - summary.totalPayouts - breakdown.refunds

      return {
        success: true,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          summary,
          breakdown
        }
      }
    } catch (error) {
      console.error('Error generating financial report:', error)
      return {
        success: false,
        error: { 
          message: 'Failed to generate financial report',
          details: error
        }
      }
    }
  }
}

export const paymentService = new PaymentService()
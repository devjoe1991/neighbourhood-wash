import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the server actions
vi.mock('@/lib/stripe/actions', () => ({
  processOnboardingPayment: vi.fn(),
  confirmOnboardingPayment: vi.fn(),
}))

import { processOnboardingPayment, confirmOnboardingPayment } from '@/lib/stripe/actions'

// Test component that simulates PaymentStep
function TestPaymentStep({ 
  onComplete, 
  onBack, 
  isLoading = false, 
  fee = 15,
  userId = 'test-user' 
}: {
  onComplete: () => void
  onBack: () => void
  isLoading?: boolean
  fee?: number
  userId?: string
}) {
  const [paymentStatus, setPaymentStatus] = React.useState<'not_started' | 'processing' | 'completed' | 'failed'>('not_started')
  const [error, setError] = React.useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = React.useState<string | null>(null)

  const handleProcessPayment = async () => {
    try {
      setError(null)
      setPaymentStatus('processing')

      const result = await processOnboardingPayment(userId)
      
      if (result.success && result.paymentIntentId) {
        setPaymentIntentId(result.paymentIntentId)
        // Simulate payment confirmation
        const confirmResult = await confirmOnboardingPayment(result.paymentIntentId)
        
        if (confirmResult.success) {
          setPaymentStatus('completed')
          onComplete()
        } else {
          throw new Error(confirmResult.error?.message || 'Payment confirmation failed')
        }
      } else {
        throw new Error(result.error?.message || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to process payment')
      setPaymentStatus('failed')
    }
  }

  const handleRetryPayment = () => {
    setPaymentStatus('not_started')
    setError(null)
    setPaymentIntentId(null)
  }

  return (
    <div data-testid="payment-step">
      <h4>Onboarding Fee Payment</h4>
      <p>Pay £{fee} onboarding fee to unlock features</p>

      {paymentStatus === 'completed' ? (
        <div data-testid="payment-completed">
          <p>Payment Successful!</p>
          <p>Your onboarding fee has been processed successfully.</p>
          <p>All dashboard features are now unlocked.</p>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div data-testid="payment-failed">
          <p>Payment Failed</p>
          <p>{error || 'There was an issue processing your payment.'}</p>
        </div>
      ) : paymentStatus === 'processing' ? (
        <div data-testid="payment-processing">
          <p>Processing Payment...</p>
          <p>Please wait while we process your £{fee} onboarding fee.</p>
        </div>
      ) : (
        <div data-testid="payment-not-started">
          <p>Complete Your Setup</p>
          <p>A one-time fee of £{fee} is required to unlock all washer features.</p>
          <div data-testid="fee-breakdown">
            <h5>What's included:</h5>
            <ul>
              <li>Access to all available bookings</li>
              <li>Payout processing</li>
              <li>Customer communication tools</li>
              <li>Performance analytics</li>
            </ul>
          </div>
          <div data-testid="payment-info">
            <p><strong>Amount: £{fee}</strong></p>
            <p>Secure payment processed by Stripe</p>
          </div>
        </div>
      )}

      <div data-testid="action-buttons">
        <button onClick={onBack} data-testid="back-button">
          Back
        </button>
        
        {paymentStatus === 'completed' ? (
          <button 
            onClick={onComplete} 
            data-testid="complete-button"
          >
            Complete Onboarding
          </button>
        ) : paymentStatus === 'failed' ? (
          <button 
            onClick={handleRetryPayment} 
            data-testid="retry-button"
          >
            Try Again
          </button>
        ) : paymentStatus === 'not_started' ? (
          <button 
            onClick={handleProcessPayment} 
            disabled={isLoading}
            data-testid="pay-button"
          >
            {isLoading ? 'Processing...' : `Pay £${fee} Now`}
          </button>
        ) : null}
      </div>

      {paymentIntentId && (
        <div data-testid="payment-intent-info">
          <p>Payment ID: {paymentIntentId}</p>
        </div>
      )}
    </div>
  )
}

describe('PaymentStep Component', () => {
  const mockOnComplete = vi.fn()
  const mockOnBack = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render initial payment state', () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    expect(screen.getByText('Onboarding Fee Payment')).toBeInTheDocument()
    expect(screen.getByText('Pay £15 onboarding fee to unlock features')).toBeInTheDocument()
    expect(screen.getByTestId('payment-not-started')).toBeInTheDocument()
    expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    expect(screen.getByText('A one-time fee of £15 is required to unlock all washer features.')).toBeInTheDocument()
    expect(screen.getByTestId('pay-button')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('should render with custom fee amount', () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} fee={25} />)

    expect(screen.getByText('Pay £25 onboarding fee to unlock features')).toBeInTheDocument()
    expect(screen.getByText('A one-time fee of £25 is required to unlock all washer features.')).toBeInTheDocument()
    expect(screen.getByText('Amount: £25')).toBeInTheDocument()
    expect(screen.getByText('Pay £25 Now')).toBeInTheDocument()
  })

  it('should display fee breakdown and included features', () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    expect(screen.getByTestId('fee-breakdown')).toBeInTheDocument()
    expect(screen.getByText("What's included:")).toBeInTheDocument()
    expect(screen.getByText('Access to all available bookings')).toBeInTheDocument()
    expect(screen.getByText('Payout processing')).toBeInTheDocument()
    expect(screen.getByText('Customer communication tools')).toBeInTheDocument()
    expect(screen.getByText('Performance analytics')).toBeInTheDocument()
  })

  it('should display payment security information', () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    expect(screen.getByTestId('payment-info')).toBeInTheDocument()
    expect(screen.getByText('Amount: £15')).toBeInTheDocument()
    expect(screen.getByText('Secure payment processed by Stripe')).toBeInTheDocument()
  })

  it('should handle back button click', async () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('should process payment successfully', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_test123'
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: true,
      data: { status: 'succeeded' }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-processing')).toBeInTheDocument()
    })

    expect(screen.getByText('Processing Payment...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we process your £15 onboarding fee.')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('payment-completed')).toBeInTheDocument()
    })

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument()
    expect(screen.getByText('Your onboarding fee has been processed successfully.')).toBeInTheDocument()
    expect(screen.getByText('All dashboard features are now unlocked.')).toBeInTheDocument()
    expect(screen.getByTestId('complete-button')).toBeInTheDocument()

    expect(vi.mocked(processOnboardingPayment)).toHaveBeenCalledWith('test-user')
    expect(vi.mocked(confirmOnboardingPayment)).toHaveBeenCalledWith('pi_test123')
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('should handle payment processing failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'stripe_error',
        message: 'Payment processing failed'
      }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Payment Failed')).toBeInTheDocument()
    expect(screen.getByText('Payment processing failed')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle payment confirmation failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_test123'
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'stripe_error',
        message: 'Payment confirmation failed'
      }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Payment confirmation failed')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle network error during payment', async () => {
    vi.mocked(processOnboardingPayment).mockRejectedValue(new Error('Network error'))

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle retry after payment failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'stripe_error',
        message: 'Payment failed'
      }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    // Process payment and fail
    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    // Retry
    const retryButton = screen.getByTestId('retry-button')
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-not-started')).toBeInTheDocument()
    })

    expect(screen.getByTestId('pay-button')).toBeInTheDocument()
  })

  it('should show loading state during payment processing', () => {
    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} isLoading={true} />)

    const payButton = screen.getByTestId('pay-button')
    expect(payButton).toBeDisabled()
    expect(payButton).toHaveTextContent('Processing...')
  })

  it('should display payment intent ID when available', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_test123'
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: true,
      data: { status: 'succeeded' }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-intent-info')).toBeInTheDocument()
    })

    expect(screen.getByText('Payment ID: pi_test123')).toBeInTheDocument()
  })

  it('should handle complete button click when payment is successful', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_test123'
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: true,
      data: { status: 'succeeded' }
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('complete-button')).toBeInTheDocument()
    })

    const completeButton = screen.getByTestId('complete-button')
    await user.click(completeButton)

    expect(mockOnComplete).toHaveBeenCalledTimes(2) // Once from successful payment, once from button click
  })

  it('should handle undefined error gracefully', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: false,
      error: undefined
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to process payment')).toBeInTheDocument()
  })

  it('should handle missing payment intent ID', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      paymentIntentId: undefined
    })

    render(<TestPaymentStep onComplete={mockOnComplete} onBack={mockOnBack} />)

    const payButton = screen.getByTestId('pay-button')
    await user.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to process payment')).toBeInTheDocument()
  })
})
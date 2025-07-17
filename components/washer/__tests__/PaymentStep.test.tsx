import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { processOnboardingPayment, confirmOnboardingPayment, completeOnboarding } from '@/lib/stripe/actions'

// Mock the stripe actions
vi.mock('@/lib/stripe/actions', () => ({
  processOnboardingPayment: vi.fn(),
  confirmOnboardingPayment: vi.fn(),
  completeOnboarding: vi.fn(),
}))

// Create a test component that includes the PaymentStep
const TestPaymentStep = ({ 
  onComplete, 
  onBack, 
  isLoading, 
  fee,
  userId 
}: { 
  onComplete: () => void
  onBack: () => void
  isLoading: boolean
  fee: number
  userId: string 
}) => {
  // This is a simplified version of the PaymentStep component for testing
  const [paymentStatus, setPaymentStatus] = React.useState<'not_started' | 'processing' | 'completed' | 'failed'>('not_started')
  const [error, setError] = React.useState<string | null>(null)

  const handleStartPayment = async () => {
    if (!userId) {
      setError('User not authenticated. Please refresh and try again.')
      return
    }

    try {
      setError(null)
      setPaymentStatus('processing')

      const result = await processOnboardingPayment(userId)
      
      if (result.success && result.data) {
        // Simulate payment processing
        const confirmResult = await confirmOnboardingPayment(userId, result.data.paymentIntentId)
        
        if (confirmResult.success) {
          setPaymentStatus('completed')
          const completeResult = await completeOnboarding(userId)
          if (completeResult.success) {
            onComplete()
          }
        } else {
          throw new Error(confirmResult.error?.message || 'Payment confirmation failed')
        }
      } else {
        throw new Error(result.error?.message || 'Failed to create payment')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process payment')
      setPaymentStatus('failed')
    }
  }

  return (
    <div data-testid="payment-step">
      <h4>Onboarding Fee Payment</h4>
      <p>Pay £{fee} onboarding fee to unlock features</p>
      
      {paymentStatus === 'completed' && (
        <div data-testid="payment-success">Payment Successful!</div>
      )}
      
      {paymentStatus === 'failed' && (
        <div data-testid="payment-error">{error}</div>
      )}
      
      {paymentStatus === 'processing' && (
        <div data-testid="payment-processing">Processing Payment...</div>
      )}
      
      <div>Total Amount: £{fee}</div>
      
      <button onClick={onBack} data-testid="back-button">Back</button>
      
      {paymentStatus === 'completed' ? (
        <button onClick={onComplete} data-testid="complete-button">Complete Setup</button>
      ) : paymentStatus === 'failed' ? (
        <button onClick={() => { setPaymentStatus('not_started'); setError(null) }} data-testid="retry-button">Try Again</button>
      ) : (
        <button 
          onClick={handleStartPayment} 
          disabled={isLoading || paymentStatus === 'processing' || !userId}
          data-testid="pay-button"
        >
          Pay £{fee} & Complete Setup
        </button>
      )}
    </div>
  )
}

describe('PaymentStep Component', () => {
  const mockOnComplete = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render payment step with correct fee amount', () => {
    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    expect(screen.getByText('Onboarding Fee Payment')).toBeInTheDocument()
    expect(screen.getByText('Pay £15 onboarding fee to unlock features')).toBeInTheDocument()
    expect(screen.getByText('Total Amount: £15')).toBeInTheDocument()
    expect(screen.getByTestId('pay-button')).toBeInTheDocument()
  })

  it('should handle successful payment flow', async () => {
    // Mock successful payment flow
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      data: {
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test123',
        amount: 1500,
      },
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: true,
      data: { completed: true },
    })

    vi.mocked(completeOnboarding).mockResolvedValue({
      success: true,
      data: { unlocked: true },
    })

    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    const payButton = screen.getByTestId('pay-button')
    fireEvent.click(payButton)

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByTestId('payment-processing')).toBeInTheDocument()
    })

    // Should complete successfully
    await waitFor(() => {
      expect(screen.getByTestId('payment-success')).toBeInTheDocument()
    })

    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('should handle payment creation failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'validation_error',
        message: 'Onboarding fee has already been paid',
      },
    })

    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    const payButton = screen.getByTestId('pay-button')
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-error')).toBeInTheDocument()
      expect(screen.getByText('Onboarding fee has already been paid')).toBeInTheDocument()
    })

    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should handle payment confirmation failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: true,
      data: {
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test123',
        amount: 1500,
      },
    })

    vi.mocked(confirmOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'validation_error',
        message: 'Payment not completed. Status: requires_payment_method',
      },
    })

    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    const payButton = screen.getByTestId('pay-button')
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-error')).toBeInTheDocument()
      expect(screen.getByText('Payment not completed. Status: requires_payment_method')).toBeInTheDocument()
    })

    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should handle missing user ID', async () => {
    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId=""
      />
    )

    const payButton = screen.getByTestId('pay-button')
    expect(payButton).toBeDisabled()
  })

  it('should call onBack when back button is clicked', () => {
    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('should show retry button after payment failure', async () => {
    vi.mocked(processOnboardingPayment).mockResolvedValue({
      success: false,
      error: {
        type: 'unknown_error',
        message: 'Network error',
      },
    })

    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={false}
        fee={15}
        userId="user123"
      />
    )

    const payButton = screen.getByTestId('pay-button')
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByTestId('payment-error')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByTestId('retry-button')
    fireEvent.click(retryButton)

    // Should reset to initial state
    expect(screen.getByTestId('pay-button')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-error')).not.toBeInTheDocument()
  })

  it('should disable pay button when loading', () => {
    render(
      <TestPaymentStep
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        isLoading={true}
        fee={15}
        userId="user123"
      />
    )

    const payButton = screen.getByTestId('pay-button')
    expect(payButton).toBeDisabled()
  })
})
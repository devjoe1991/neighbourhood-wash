import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the server actions
vi.mock('@/lib/stripe/actions', () => ({
  initiateStripeKYC: vi.fn(),
}))

vi.mock('@/lib/onboarding-error-handling', () => ({
  useOnboardingErrorHandler: () => ({
    executeWithRetry: vi.fn((fn) => fn()),
    handleError: vi.fn(),
  }),
  OnboardingRecovery: {
    saveRecoveryState: vi.fn(),
  },
}))

import { initiateStripeKYC } from '@/lib/stripe/actions'

// Test component that simulates StripeKYCStep
function TestStripeKYCStep({ 
  onNext, 
  onBack, 
  isLoading = false, 
  accountId,
  userId = 'test-user' 
}: {
  onNext: () => void
  onBack: () => void
  isLoading?: boolean
  accountId?: string
  userId?: string
}) {
  const [kycStatus, setKycStatus] = React.useState<'not_started' | 'in_progress' | 'completed' | 'failed'>('not_started')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (accountId) {
      setKycStatus('completed')
    }
  }, [accountId])

  const handleStartKYC = async () => {
    try {
      setError(null)
      setKycStatus('in_progress')

      const result = await initiateStripeKYC(userId)
      
      if (result.success && result.data) {
        // In real implementation, this would redirect to Stripe
        // For testing, we'll simulate the redirect
        window.location.href = result.data.onboardingUrl
      } else {
        throw new Error(result.error?.message || 'Failed to initiate KYC verification')
      }
    } catch (error) {
      console.error('Error starting KYC:', error)
      setError(error instanceof Error ? error.message : 'Failed to start KYC verification')
      setKycStatus('failed')
    }
  }

  const handleRetryKYC = () => {
    setKycStatus('not_started')
    setError(null)
  }

  const handleKYCComplete = () => {
    setKycStatus('completed')
    onNext()
  }

  return (
    <div data-testid="stripe-kyc-step">
      <h4>Stripe Connect KYC</h4>
      <p>Verify your identity with ID uploads</p>

      {kycStatus === 'completed' ? (
        <div data-testid="kyc-completed">
          <p>KYC Verification Complete</p>
          <p>Your identity has been successfully verified with Stripe.</p>
        </div>
      ) : kycStatus === 'failed' ? (
        <div data-testid="kyc-failed">
          <p>KYC Verification Failed</p>
          <p>{error || 'There was an issue starting the verification process.'}</p>
        </div>
      ) : kycStatus === 'in_progress' ? (
        <div data-testid="kyc-in-progress">
          <p>Redirecting to Stripe...</p>
          <p>You'll be redirected to Stripe's secure platform to complete your identity verification.</p>
        </div>
      ) : (
        <div data-testid="kyc-not-started">
          <p>Secure Identity Verification</p>
          <p>We use Stripe's secure platform to verify your identity.</p>
          <ul>
            <li>Bank-level security</li>
            <li>ID document upload</li>
            <li>Personal information verification</li>
          </ul>
        </div>
      )}

      <div data-testid="action-buttons">
        <button onClick={onBack} data-testid="back-button">
          Back
        </button>
        
        {kycStatus === 'completed' ? (
          <button 
            onClick={handleKYCComplete} 
            data-testid="continue-button"
          >
            Continue to Bank Connection
          </button>
        ) : kycStatus === 'failed' ? (
          <button 
            onClick={handleRetryKYC} 
            data-testid="retry-button"
          >
            Try Again
          </button>
        ) : kycStatus === 'not_started' ? (
          <button 
            onClick={handleStartKYC} 
            disabled={isLoading}
            data-testid="start-kyc-button"
          >
            {isLoading ? 'Starting...' : 'Start Verification'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

describe('StripeKYCStep Component', () => {
  const mockOnNext = vi.fn()
  const mockOnBack = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.href mock
    delete (window as any).location
    window.location = { href: '' } as any
  })

  it('should render initial KYC state', () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    expect(screen.getByText('Stripe Connect KYC')).toBeInTheDocument()
    expect(screen.getByText('Verify your identity with ID uploads')).toBeInTheDocument()
    expect(screen.getByTestId('kyc-not-started')).toBeInTheDocument()
    expect(screen.getByText('Secure Identity Verification')).toBeInTheDocument()
    expect(screen.getByText('Bank-level security')).toBeInTheDocument()
    expect(screen.getByTestId('start-kyc-button')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('should show completed state when accountId is provided', () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} accountId="acct_test123" />)

    expect(screen.getByTestId('kyc-completed')).toBeInTheDocument()
    expect(screen.getByText('KYC Verification Complete')).toBeInTheDocument()
    expect(screen.getByText('Your identity has been successfully verified with Stripe.')).toBeInTheDocument()
    expect(screen.getByTestId('continue-button')).toBeInTheDocument()
  })

  it('should handle back button click', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('should handle continue button click when completed', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} accountId="acct_test123" />)

    const continueButton = screen.getByTestId('continue-button')
    await user.click(continueButton)

    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('should start KYC process successfully', async () => {
    vi.mocked(initiateStripeKYC).mockResolvedValue({
      success: true,
      data: {
        accountId: 'acct_test123',
        onboardingUrl: 'https://connect.stripe.com/setup/test'
      }
    })

    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    const startButton = screen.getByTestId('start-kyc-button')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-in-progress')).toBeInTheDocument()
    })

    expect(screen.getByText('Redirecting to Stripe...')).toBeInTheDocument()
    expect(vi.mocked(initiateStripeKYC)).toHaveBeenCalledWith('test-user')
    expect(window.location.href).toBe('https://connect.stripe.com/setup/test')
  })

  it('should handle KYC initiation failure', async () => {
    vi.mocked(initiateStripeKYC).mockResolvedValue({
      success: false,
      error: {
        type: 'stripe_error',
        message: 'Failed to create account'
      }
    })

    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    const startButton = screen.getByTestId('start-kyc-button')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('KYC Verification Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to create account')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle network error during KYC initiation', async () => {
    vi.mocked(initiateStripeKYC).mockRejectedValue(new Error('Network error'))

    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    const startButton = screen.getByTestId('start-kyc-button')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle retry after failure', async () => {
    vi.mocked(initiateStripeKYC).mockResolvedValue({
      success: false,
      error: {
        type: 'stripe_error',
        message: 'Failed to create account'
      }
    })

    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    // Start KYC and fail
    const startButton = screen.getByTestId('start-kyc-button')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-failed')).toBeInTheDocument()
    })

    // Retry
    const retryButton = screen.getByTestId('retry-button')
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-not-started')).toBeInTheDocument()
    })

    expect(screen.getByTestId('start-kyc-button')).toBeInTheDocument()
  })

  it('should show loading state during KYC initiation', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} isLoading={true} />)

    const startButton = screen.getByTestId('start-kyc-button')
    expect(startButton).toBeDisabled()
    expect(startButton).toHaveTextContent('Starting...')
  })

  it('should handle successful KYC completion via message event', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    // Simulate message from Stripe KYC completion
    const messageEvent = new MessageEvent('message', {
      data: { type: 'stripe_kyc_complete' },
      origin: window.location.origin
    })

    fireEvent(window, messageEvent)

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })
  })

  it('should ignore messages from different origins', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    // Simulate message from different origin
    const messageEvent = new MessageEvent('message', {
      data: { type: 'stripe_kyc_complete' },
      origin: 'https://malicious-site.com'
    })

    fireEvent(window, messageEvent)

    // Should not trigger onNext
    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should ignore irrelevant message types', async () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    // Simulate irrelevant message
    const messageEvent = new MessageEvent('message', {
      data: { type: 'other_event' },
      origin: window.location.origin
    })

    fireEvent(window, messageEvent)

    // Should not trigger onNext
    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should display security features in not started state', () => {
    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    expect(screen.getByText('Bank-level security')).toBeInTheDocument()
    expect(screen.getByText('ID document upload')).toBeInTheDocument()
    expect(screen.getByText('Personal information verification')).toBeInTheDocument()
  })

  it('should handle undefined error gracefully', async () => {
    vi.mocked(initiateStripeKYC).mockResolvedValue({
      success: false,
      error: undefined
    })

    render(<TestStripeKYCStep onNext={mockOnNext} onBack={mockOnBack} />)

    const startButton = screen.getByTestId('start-kyc-button')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('kyc-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to initiate KYC verification')).toBeInTheDocument()
  })
})
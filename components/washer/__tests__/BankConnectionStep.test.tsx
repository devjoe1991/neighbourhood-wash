import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the server actions
vi.mock('@/lib/stripe/actions', () => ({
  checkBankConnectionStatus: vi.fn(),
  createStripeAccountLink: vi.fn(),
}))

import { checkBankConnectionStatus, createStripeAccountLink } from '@/lib/stripe/actions'

// Test component that simulates BankConnectionStep
function TestBankConnectionStep({ 
  onNext, 
  onBack, 
  isLoading = false, 
  userId = 'test-user' 
}: {
  onNext: () => void
  onBack: () => void
  isLoading?: boolean
  userId?: string
}) {
  const [bankStatus, setBankStatus] = React.useState<'not_connected' | 'connecting' | 'connected' | 'failed'>('not_connected')
  const [error, setError] = React.useState<string | null>(null)

  const handleConnectBank = async () => {
    try {
      setError(null)
      setBankStatus('connecting')

      // Simulate bank connection process
      const linkResult = await createStripeAccountLink('acct_test123')
      
      if (linkResult.success && linkResult.url) {
        // In real implementation, this would redirect to Stripe
        window.location.href = linkResult.url
      } else {
        throw new Error(linkResult.message || 'Failed to create bank connection link')
      }
    } catch (error) {
      console.error('Error connecting bank:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect bank account')
      setBankStatus('failed')
    }
  }

  const handleRetryConnection = () => {
    setBankStatus('not_connected')
    setError(null)
  }

  const handleBankConnected = () => {
    setBankStatus('connected')
    onNext()
  }

  const checkConnectionStatus = async () => {
    try {
      const result = await checkBankConnectionStatus('acct_test123')
      if (result.success && result.data?.bankConnected) {
        setBankStatus('connected')
      }
    } catch (error) {
      console.error('Error checking bank status:', error)
    }
  }

  React.useEffect(() => {
    checkConnectionStatus()
  }, [])

  return (
    <div data-testid="bank-connection-step">
      <h4>Bank Account Connection</h4>
      <p>Connect your bank for payouts</p>

      {bankStatus === 'connected' ? (
        <div data-testid="bank-connected">
          <p>Bank Account Connected</p>
          <p>Your bank account has been successfully connected and verified.</p>
        </div>
      ) : bankStatus === 'failed' ? (
        <div data-testid="bank-failed">
          <p>Bank Connection Failed</p>
          <p>{error || 'There was an issue connecting your bank account.'}</p>
        </div>
      ) : bankStatus === 'connecting' ? (
        <div data-testid="bank-connecting">
          <p>Redirecting to Bank Connection...</p>
          <p>You'll be redirected to securely connect your bank account.</p>
        </div>
      ) : (
        <div data-testid="bank-not-connected">
          <p>Secure Bank Connection</p>
          <p>Connect your bank account to receive payouts from completed bookings.</p>
          <ul>
            <li>Bank-level encryption</li>
            <li>Instant verification</li>
            <li>Secure payout processing</li>
          </ul>
        </div>
      )}

      <div data-testid="action-buttons">
        <button onClick={onBack} data-testid="back-button">
          Back
        </button>
        
        {bankStatus === 'connected' ? (
          <button 
            onClick={handleBankConnected} 
            data-testid="continue-button"
          >
            Continue to Payment
          </button>
        ) : bankStatus === 'failed' ? (
          <button 
            onClick={handleRetryConnection} 
            data-testid="retry-button"
          >
            Try Again
          </button>
        ) : bankStatus === 'not_connected' ? (
          <button 
            onClick={handleConnectBank} 
            disabled={isLoading}
            data-testid="connect-bank-button"
          >
            {isLoading ? 'Connecting...' : 'Connect Bank Account'}
          </button>
        ) : null}
      </div>

      <button 
        onClick={checkConnectionStatus} 
        data-testid="refresh-status-button"
      >
        Refresh Status
      </button>
    </div>
  )
}

describe('BankConnectionStep Component', () => {
  const mockOnNext = vi.fn()
  const mockOnBack = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.href mock
    delete (window as any).location
    window.location = { href: '' } as any
  })

  it('should render initial bank connection state', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('Bank Account Connection')).toBeInTheDocument()
    })

    expect(screen.getByText('Connect your bank for payouts')).toBeInTheDocument()
    expect(screen.getByTestId('bank-not-connected')).toBeInTheDocument()
    expect(screen.getByText('Secure Bank Connection')).toBeInTheDocument()
    expect(screen.getByText('Bank-level encryption')).toBeInTheDocument()
    expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('should show connected state when bank is already connected', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: true }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('bank-connected')).toBeInTheDocument()
    })

    expect(screen.getByText('Bank Account Connected')).toBeInTheDocument()
    expect(screen.getByText('Your bank account has been successfully connected and verified.')).toBeInTheDocument()
    expect(screen.getByTestId('continue-button')).toBeInTheDocument()
  })

  it('should handle back button click', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('back-button')).toBeInTheDocument()
    })

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('should handle continue button click when connected', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: true }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('continue-button')).toBeInTheDocument()
    })

    const continueButton = screen.getByTestId('continue-button')
    await user.click(continueButton)

    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('should start bank connection process successfully', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    vi.mocked(createStripeAccountLink).mockResolvedValue({
      success: true,
      url: 'https://connect.stripe.com/bank/test'
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    const connectButton = screen.getByTestId('connect-bank-button')
    await user.click(connectButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-connecting')).toBeInTheDocument()
    })

    expect(screen.getByText('Redirecting to Bank Connection...')).toBeInTheDocument()
    expect(vi.mocked(createStripeAccountLink)).toHaveBeenCalledWith('acct_test123')
    expect(window.location.href).toBe('https://connect.stripe.com/bank/test')
  })

  it('should handle bank connection failure', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    vi.mocked(createStripeAccountLink).mockResolvedValue({
      success: false,
      message: 'Failed to create bank connection link'
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    const connectButton = screen.getByTestId('connect-bank-button')
    await user.click(connectButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Bank Connection Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to create bank connection link')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle network error during bank connection', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    vi.mocked(createStripeAccountLink).mockRejectedValue(new Error('Network error'))

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    const connectButton = screen.getByTestId('connect-bank-button')
    await user.click(connectButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should handle retry after failure', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    vi.mocked(createStripeAccountLink).mockResolvedValue({
      success: false,
      message: 'Connection failed'
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    // Start connection and fail
    const connectButton = screen.getByTestId('connect-bank-button')
    await user.click(connectButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-failed')).toBeInTheDocument()
    })

    // Retry
    const retryButton = screen.getByTestId('retry-button')
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-not-connected')).toBeInTheDocument()
    })

    expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
  })

  it('should show loading state during bank connection', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} isLoading={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    const connectButton = screen.getByTestId('connect-bank-button')
    expect(connectButton).toBeDisabled()
    expect(connectButton).toHaveTextContent('Connecting...')
  })

  it('should refresh bank connection status', async () => {
    vi.mocked(checkBankConnectionStatus)
      .mockResolvedValueOnce({
        success: true,
        data: { bankConnected: false }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { bankConnected: true }
      })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('bank-not-connected')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTestId('refresh-status-button')
    await user.click(refreshButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-connected')).toBeInTheDocument()
    })

    expect(vi.mocked(checkBankConnectionStatus)).toHaveBeenCalledTimes(2)
  })

  it('should handle bank status check failure gracefully', async () => {
    vi.mocked(checkBankConnectionStatus).mockRejectedValue(new Error('Status check failed'))

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    // Should still render the component even if status check fails
    await waitFor(() => {
      expect(screen.getByText('Bank Account Connection')).toBeInTheDocument()
    })

    expect(screen.getByTestId('bank-not-connected')).toBeInTheDocument()
  })

  it('should display security features in not connected state', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('Bank-level encryption')).toBeInTheDocument()
    })

    expect(screen.getByText('Instant verification')).toBeInTheDocument()
    expect(screen.getByText('Secure payout processing')).toBeInTheDocument()
  })

  it('should handle undefined error gracefully', async () => {
    vi.mocked(checkBankConnectionStatus).mockResolvedValue({
      success: true,
      data: { bankConnected: false }
    })

    vi.mocked(createStripeAccountLink).mockResolvedValue({
      success: false,
      message: undefined
    })

    render(<TestBankConnectionStep onNext={mockOnNext} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('connect-bank-button')).toBeInTheDocument()
    })

    const connectButton = screen.getByTestId('connect-bank-button')
    await user.click(connectButton)

    await waitFor(() => {
      expect(screen.getByTestId('bank-failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to connect bank account')).toBeInTheDocument()
  })
})
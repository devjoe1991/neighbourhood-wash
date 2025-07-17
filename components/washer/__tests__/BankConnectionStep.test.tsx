import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the stripe actions
vi.mock('@/lib/stripe/actions', () => ({
  initiateBankConnection: vi.fn(),
}))

// Mock window.location
const mockLocation = {
  href: '',
  search: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock window.addEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

// Import the component after mocking
import { WasherOnboardingFlow } from '../WasherOnboardingFlow'

describe('BankConnectionStep', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' }
  const mockProfile = {} as any
  const mockOnStepComplete = vi.fn()
  const mockOnOnboardingComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    mockLocation.search = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper function to render the component at step 3 (bank connection)
  const renderBankConnectionStep = () => {
    // Mock the onboarding status to be at step 3
    vi.doMock('@/lib/stripe/actions', () => ({
      getOnboardingStatus: vi.fn().mockResolvedValue({
        success: true,
        data: {
          currentStep: 3,
          completedSteps: [1, 2],
          isComplete: false,
        },
      }),
      initiateBankConnection: vi.fn(),
    }))

    return render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )
  }

  it('should display bank connection step with correct content', async () => {
    renderBankConnectionStep()

    await waitFor(() => {
      expect(screen.getByText('Bank Account Connection')).toBeInTheDocument()
      expect(screen.getByText('Connect your bank account for payouts')).toBeInTheDocument()
      expect(screen.getByText('Secure Bank Account Connection')).toBeInTheDocument()
      expect(screen.getByText('Connect your UK bank account to receive payments. Your banking details are securely handled by Stripe.')).toBeInTheDocument()
    })
  })

  it('should show connect bank account button initially', async () => {
    renderBankConnectionStep()

    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect bank account/i })
      expect(connectButton).toBeInTheDocument()
      expect(connectButton).not.toBeDisabled()
    })
  })

  it('should show back button', async () => {
    renderBankConnectionStep()

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeInTheDocument()
      expect(backButton).not.toBeDisabled()
    })
  })

  it('should display loading state when connecting bank', async () => {
    const { initiateBankConnection } = await import('@/lib/stripe/actions')
    const mockInitiateBankConnection = initiateBankConnection as any

    // Mock a delayed response
    mockInitiateBankConnection.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { bankConnectionUrl: 'https://stripe.com/connect' }
      }), 100))
    )

    renderBankConnectionStep()

    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect bank account/i })
      fireEvent.click(connectButton)
    })

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to Stripe...')).toBeInTheDocument()
    })
  })

  it('should handle successful bank connection initiation', async () => {
    const { initiateBankConnection } = await import('@/lib/stripe/actions')
    const mockInitiateBankConnection = initiateBankConnection as any

    mockInitiateBankConnection.mockResolvedValue({
      success: true,
      data: {
        accountId: 'acct_test123',
        bankConnectionUrl: 'https://stripe.com/connect/bank',
      },
    })

    renderBankConnectionStep()

    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect bank account/i })
      fireEvent.click(connectButton)
    })

    await waitFor(() => {
      expect(mockInitiateBankConnection).toHaveBeenCalledWith('user123')
      expect(mockLocation.href).toBe('https://stripe.com/connect/bank')
    })
  })

  it('should handle bank connection errors', async () => {
    const { initiateBankConnection } = await import('@/lib/stripe/actions')
    const mockInitiateBankConnection = initiateBankConnection as any

    mockInitiateBankConnection.mockResolvedValue({
      success: false,
      error: {
        type: 'validation_error',
        message: 'KYC verification must be complete before connecting bank account',
      },
    })

    renderBankConnectionStep()

    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect bank account/i })
      fireEvent.click(connectButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Bank Connection Failed')).toBeInTheDocument()
      expect(screen.getByText('KYC verification must be complete before connecting bank account')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  it('should show completed state when bank connection is successful', async () => {
    renderBankConnectionStep()

    // Simulate URL parameter indicating completion
    mockLocation.search = '?bank_connection=complete'

    // Re-render to trigger useEffect
    renderBankConnectionStep()

    await waitFor(() => {
      expect(screen.getByText('Bank Account Connected')).toBeInTheDocument()
      expect(screen.getByText('Your bank account has been successfully connected. You can now receive payouts directly to your account.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument()
    })
  })

  it('should allow retry after failed connection', async () => {
    const { initiateBankConnection } = await import('@/lib/stripe/actions')
    const mockInitiateBankConnection = initiateBankConnection as any

    // First call fails
    mockInitiateBankConnection.mockResolvedValueOnce({
      success: false,
      error: { message: 'Connection failed' },
    })

    // Second call succeeds
    mockInitiateBankConnection.mockResolvedValueOnce({
      success: true,
      data: { bankConnectionUrl: 'https://stripe.com/connect' },
    })

    renderBankConnectionStep()

    // First attempt
    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect bank account/i })
      fireEvent.click(connectButton)
    })

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Bank Connection Failed')).toBeInTheDocument()
    })

    // Retry
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)

    // Should show initial state again
    await waitFor(() => {
      expect(screen.getByText('Secure Bank Account Connection')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /connect bank account/i })).toBeInTheDocument()
    })

    // Second attempt should succeed
    const connectButton = screen.getByRole('button', { name: /connect bank account/i })
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://stripe.com/connect')
    })
  })

  it('should call onNext when bank connection is completed', async () => {
    renderBankConnectionStep()

    // Simulate completion
    mockLocation.search = '?bank_connection=complete'
    renderBankConnectionStep()

    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue to payment/i })
      fireEvent.click(continueButton)
    })

    expect(mockOnStepComplete).toHaveBeenCalledWith(3, {})
  })
})
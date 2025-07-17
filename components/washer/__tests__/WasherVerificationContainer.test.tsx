import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WasherVerificationContainer } from '../WasherVerificationContainer'
import * as stripeActions from '@/lib/stripe/actions'
import * as errorHandling from '@/lib/error-handling'

// Mock the stripe actions
vi.mock('@/lib/stripe/actions', () => ({
  createStripeConnectedAccount: vi.fn(),
  createStripeAccountLink: vi.fn(),
}))

// Mock the error handling
vi.mock('@/lib/error-handling', () => ({
  withRetry: vi.fn((fn) => fn()),
  showErrorToast: vi.fn(),
  showLoadingToast: vi.fn(() => ({
    update: vi.fn(),
    dismiss: vi.fn(),
  })),
  getUserFriendlyErrorMessage: vi.fn((error) => ({
    description: error?.message || 'An error occurred',
    canRetry: true,
  })),
  VerificationRecovery: {
    getRecoveryState: vi.fn(),
    saveRecoveryState: vi.fn(),
    clearRecoveryState: vi.fn(),
  },
}))

// Mock the verification loading state
vi.mock('../VerificationLoadingState', () => ({
  useVerificationLoading: () => ({
    loadingState: null,
    startLoading: vi.fn(),
    updateStage: vi.fn(),
    stopLoading: vi.fn(),
    LoadingComponent: null,
  }),
}))

describe('WasherVerificationContainer', () => {
  const mockOnVerificationStarted = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.href mock
    delete (window as any).location
    window.location = { href: '' } as any
  })

  it('renders the verification container with all required elements', () => {
    render(<WasherVerificationContainer onVerificationStarted={mockOnVerificationStarted} />)

    // Check main title
    expect(screen.getByText('Complete Your Washer Verification')).toBeInTheDocument()
    
    // Check description
    expect(screen.getByText(/To start accepting bookings and receiving payments/)).toBeInTheDocument()
    
    // Check verification steps
    expect(screen.getByText('Identity Verification')).toBeInTheDocument()
    expect(screen.getByText('Payment Setup')).toBeInTheDocument()
    expect(screen.getByText('Business Information')).toBeInTheDocument()
    
    // Check start verification button
    expect(screen.getByRole('button', { name: /Start Verification Process/i })).toBeInTheDocument()
    
    // Check why verification section
    expect(screen.getByText('Why do we need verification?')).toBeInTheDocument()
  })

  it('displays verification steps with correct descriptions', () => {
    render(<WasherVerificationContainer />)

    expect(screen.getByText('Verify your identity with a government-issued ID to ensure platform security.')).toBeInTheDocument()
    expect(screen.getByText('Connect your bank account to receive payments for completed bookings.')).toBeInTheDocument()
    expect(screen.getByText('Provide basic business details required for tax and compliance purposes.')).toBeInTheDocument()
  })

  it('shows recovery state when available', () => {
    vi.mocked(errorHandling.VerificationRecovery.getRecoveryState).mockReturnValue({
      step: 'starting_verification',
      userId: 'test-user',
      accountId: 'acct_test'
    })

    render(<WasherVerificationContainer />)

    expect(screen.getByText('Resume Verification')).toBeInTheDocument()
    expect(screen.getByText(/It looks like you started verification before/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Fresh' })).toBeInTheDocument()
  })

  it('handles successful verification start', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockResolvedValue({
      success: true,
      accountId: 'acct_test123'
    })
    
    vi.mocked(stripeActions.createStripeAccountLink).mockResolvedValue({
      success: true,
      url: 'https://connect.stripe.com/setup/test'
    })

    render(<WasherVerificationContainer onVerificationStarted={mockOnVerificationStarted} />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(stripeActions.createStripeConnectedAccount).toHaveBeenCalled()
      expect(stripeActions.createStripeAccountLink).toHaveBeenCalledWith('acct_test123')
      expect(mockOnVerificationStarted).toHaveBeenCalled()
    })

    // Should redirect after successful setup
    await waitFor(() => {
      expect(window.location.href).toBe('https://connect.stripe.com/setup/test')
    }, { timeout: 2000 })
  })

  it('handles account creation failure', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockResolvedValue({
      success: false,
      message: 'Failed to create account'
    })

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalled()
    })

    // Should show error state
    expect(screen.getByText('Verification Error')).toBeInTheDocument()
  })

  it('handles account link creation failure', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockResolvedValue({
      success: true,
      accountId: 'acct_test123'
    })
    
    vi.mocked(stripeActions.createStripeAccountLink).mockResolvedValue({
      success: false,
      message: 'Failed to create link'
    })

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalled()
    })
  })

  it('shows loading state during verification start', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    vi.mocked(stripeActions.createStripeConnectedAccount).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, accountId: 'acct_test' }), 100))
    )

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    // Should show loading state
    expect(screen.getByText(/Starting Verification.../)).toBeInTheDocument()
    expect(startButton).toBeDisabled()
  })

  it('prevents rapid retry attempts', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockRejectedValue(new Error('Test error'))

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    
    // First attempt
    await user.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verification Error')).toBeInTheDocument()
    })

    // Try to click retry immediately
    const retryButton = screen.getByRole('button', { name: /Try Again/i })
    await user.click(retryButton)
    await user.click(retryButton) // Second rapid click

    // Should show rate limiting error
    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Please wait a moment before trying again'
        })
      )
    })
  })

  it('handles recovery action correctly', async () => {
    const user = userEvent.setup()
    
    vi.mocked(errorHandling.VerificationRecovery.getRecoveryState).mockReturnValue({
      step: 'starting_verification',
      userId: 'test-user',
      accountId: 'acct_test'
    })

    vi.mocked(stripeActions.createStripeConnectedAccount).mockResolvedValue({
      success: true,
      accountId: 'acct_test123'
    })

    render(<WasherVerificationContainer />)

    const continueButton = screen.getByRole('button', { name: 'Continue' })
    await user.click(continueButton)

    expect(errorHandling.VerificationRecovery.clearRecoveryState).toHaveBeenCalled()
    expect(stripeActions.createStripeConnectedAccount).toHaveBeenCalled()
  })

  it('handles start fresh action correctly', async () => {
    const user = userEvent.setup()
    
    vi.mocked(errorHandling.VerificationRecovery.getRecoveryState).mockReturnValue({
      step: 'starting_verification',
      userId: 'test-user',
      accountId: 'acct_test'
    })

    render(<WasherVerificationContainer />)

    const startFreshButton = screen.getByRole('button', { name: 'Start Fresh' })
    await user.click(startFreshButton)

    // Recovery state should be hidden
    expect(screen.queryByText('Resume Verification')).not.toBeInTheDocument()
  })

  it('shows retry functionality in error messages', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockRejectedValue(new Error('Test error'))

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Verification Error')).toBeInTheDocument()
    })

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /Try Again/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('disables retry after max attempts', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockRejectedValue(new Error('Test error'))
    vi.mocked(errorHandling.getUserFriendlyErrorMessage).mockReturnValue({
      description: 'Test error',
      canRetry: false
    })

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Verification Error')).toBeInTheDocument()
    })

    // Should not show retry button when canRetry is false
    expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument()
  })

  it('clears error state when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeConnectedAccount).mockRejectedValue(new Error('Test error'))

    render(<WasherVerificationContainer />)

    const startButton = screen.getByRole('button', { name: /Start Verification Process/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Verification Error')).toBeInTheDocument()
    })

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    await user.click(dismissButton)

    expect(screen.queryByText('Verification Error')).not.toBeInTheDocument()
  })
})
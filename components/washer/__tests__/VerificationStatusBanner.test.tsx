import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerificationStatusBanner } from '../VerificationStatusBanner'
import * as stripeActions from '@/lib/stripe/actions'
import * as errorHandling from '@/lib/error-handling'

// Mock the stripe actions
vi.mock('@/lib/stripe/actions', () => ({
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
  showVerificationStatusToast: vi.fn(),
  getUserFriendlyErrorMessage: vi.fn((error) => ({
    description: error?.message || 'An error occurred',
    canRetry: true,
  })),
}))

describe('VerificationStatusBanner', () => {
  const mockOnStatusUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.href mock
    delete (window as any).location
    window.location = { href: '' } as any
  })

  it('does not render for complete status', () => {
    const { container } = render(
      <VerificationStatusBanner 
        status="complete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders incomplete status correctly', () => {
    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Verification Incomplete')).toBeInTheDocument()
    expect(screen.getByText(/Your account verification is not yet complete/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue Verification/i })).toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
  })

  it('renders pending status correctly', () => {
    render(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Verification Under Review')).toBeInTheDocument()
    expect(screen.getByText(/Your verification documents are being reviewed/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue Verification/i })).not.toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('renders requires_action status correctly', () => {
    render(
      <VerificationStatusBanner 
        status="requires_action" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Action Required')).toBeInTheDocument()
    expect(screen.getByText(/Additional information is needed/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue Verification/i })).toBeInTheDocument()
    expect(screen.getByText('REQUIRES ACTION')).toBeInTheDocument()
  })

  it('renders rejected status correctly', () => {
    render(
      <VerificationStatusBanner 
        status="rejected" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Verification Issues')).toBeInTheDocument()
    expect(screen.getByText(/There were issues with your verification/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue Verification/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument()
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
  })

  it('displays requirements when provided', () => {
    const requirements = {
      currently_due: ['individual_verification_document'],
      eventually_due: ['individual_verification_additional_document'],
      past_due: ['individual_first_name'],
      pending_verification: ['individual_id_number'],
      disabled_reason: 'rejected.fraud'
    }

    render(
      <VerificationStatusBanner 
        status="requires_action" 
        accountId="acct_test"
        requirements={requirements}
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Required now:')).toBeInTheDocument()
    expect(screen.getByText('individual verification document')).toBeInTheDocument()
    
    expect(screen.getByText('Overdue:')).toBeInTheDocument()
    expect(screen.getByText('individual first name')).toBeInTheDocument()
    
    expect(screen.getByText('Under review:')).toBeInTheDocument()
    expect(screen.getByText('individual id number')).toBeInTheDocument()
    
    expect(screen.getByText('Issue:')).toBeInTheDocument()
    expect(screen.getByText('rejected.fraud')).toBeInTheDocument()
  })

  it('displays next steps when provided', () => {
    const nextSteps = [
      'Upload a clear photo of your ID',
      'Provide additional business information'
    ]

    render(
      <VerificationStatusBanner 
        status="requires_action" 
        accountId="acct_test"
        nextSteps={nextSteps}
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(screen.getByText('Next steps:')).toBeInTheDocument()
    expect(screen.getByText('Upload a clear photo of your ID')).toBeInTheDocument()
    expect(screen.getByText('Provide additional business information')).toBeInTheDocument()
  })

  it('handles continue verification successfully', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeAccountLink).mockResolvedValue({
      success: true,
      url: 'https://connect.stripe.com/setup/continue'
    })

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test123"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(stripeActions.createStripeAccountLink).toHaveBeenCalledWith('acct_test123')
      expect(window.location.href).toBe('https://connect.stripe.com/setup/continue')
    })
  })

  it('handles continue verification failure', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeAccountLink).mockResolvedValue({
      success: false,
      message: 'Failed to create link'
    })

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalled()
    })

    // Should show error state
    expect(screen.getByText(/Failed to create link/)).toBeInTheDocument()
  })

  it('shows loading state during continue verification', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    vi.mocked(stripeActions.createStripeAccountLink).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, url: 'test' }), 100))
    )

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    // Should show loading state
    expect(screen.getByText(/Loading.../)).toBeInTheDocument()
    expect(continueButton).toBeDisabled()
  })

  it('handles refresh status successfully', async () => {
    const user = userEvent.setup()

    render(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalled()
    })
  })

  it('handles refresh status failure', async () => {
    const user = userEvent.setup()
    
    mockOnStatusUpdate.mockRejectedValue(new Error('Refresh failed'))

    render(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalled()
    })
  })

  it('shows refreshing state during status refresh', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockOnStatusUpdate.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i })
    await user.click(refreshButton)

    // Should show refreshing state
    expect(screen.getByText(/Refreshing.../)).toBeInTheDocument()
    expect(refreshButton).toBeDisabled()
  })

  it('prevents rapid retry attempts', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeAccountLink).mockRejectedValue(new Error('Test error'))

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    
    // First attempt
    await user.click(continueButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })

    // Try to click retry immediately
    const retryButton = screen.getByRole('button', { name: /Retry/i })
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

  it('shows retry functionality in error messages', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeAccountLink).mockRejectedValue(new Error('Test error'))

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /Retry/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('clears error state when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(stripeActions.createStripeAccountLink).mockRejectedValue(new Error('Test error'))

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        accountId="acct_test"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    await user.click(dismissButton)

    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument()
  })

  it('shows verification status toast when status changes', () => {
    const { rerender } = render(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        previousStatus="incomplete"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(errorHandling.showVerificationStatusToast).toHaveBeenCalledWith('pending', 'incomplete')

    // Rerender with same status should not trigger toast
    vi.clearAllMocks()
    rerender(
      <VerificationStatusBanner 
        status="pending" 
        accountId="acct_test"
        previousStatus="pending"
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    expect(errorHandling.showVerificationStatusToast).not.toHaveBeenCalled()
  })

  it('handles missing account ID gracefully', async () => {
    const user = userEvent.setup()

    render(
      <VerificationStatusBanner 
        status="incomplete" 
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Continue Verification/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(errorHandling.showErrorToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No account ID available'
        })
      )
    })
  })
})
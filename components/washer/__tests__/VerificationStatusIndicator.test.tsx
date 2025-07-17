import { render, screen } from '@testing-library/react'
import { VerificationStatusIndicator } from '../VerificationStatusIndicator'
import { useVerificationStatus } from '@/lib/hooks/use-verification-status'
import { vi } from 'vitest'

// Mock the verification status hook
vi.mock('@/lib/hooks/use-verification-status')
const mockUseVerificationStatus = useVerificationStatus as ReturnType<typeof vi.mocked>

describe('VerificationStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: true,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Checking...')).toBeInTheDocument()
    expect(screen.getByText('Verifying your account status...')).toBeInTheDocument()
  })

  it('renders verified state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('Your account is fully verified and you can access all washer features.')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
  })

  it('renders pending state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'pending',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Your verification is being processed. This may take a few business days.')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('renders requires action state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'requires_action',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Action Required')).toBeInTheDocument()
    expect(screen.getByText('Additional information is needed to complete your verification.')).toBeInTheDocument()
    expect(screen.getByText('REQUIRES_ACTION')).toBeInTheDocument()
  })

  it('renders rejected state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'rejected',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    expect(screen.getByText('Your verification was not successful. Please contact support for assistance.')).toBeInTheDocument()
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
  })

  it('renders not verified state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Not Verified')).toBeInTheDocument()
    expect(screen.getByText('Complete your Stripe Connect verification to access washer features.')).toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
      error: 'Failed to check verification status',
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Unable to check verification status')).toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
  })

  it('renders compact variant correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" variant="compact" />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    // Should still show description in compact mode
    expect(screen.getByText('Your account is fully verified and you can access all washer features.')).toBeInTheDocument()
  })

  it('renders badge-only variant correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" variant="badge-only" />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    // Should not show description in badge-only mode
    expect(screen.queryByText('Your account is fully verified and you can access all washer features.')).not.toBeInTheDocument()
  })

  it('hides description when showDescription is false', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" showDescription={false} />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.queryByText('Your account is fully verified and you can access all washer features.')).not.toBeInTheDocument()
  })

  it('shows account ID when available', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
      accountId: 'acct_test123',
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('Account ID: acct_test123')).toBeInTheDocument()
  })

  it('shows warning for unverified users with limited access', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'pending',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.getByText('⚠️ Some washer features may be limited until verification is complete.')).toBeInTheDocument()
  })

  it('does not show warning for verified users', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<VerificationStatusIndicator userId="test-user" />)

    expect(screen.queryByText('⚠️ Some washer features may be limited until verification is complete.')).not.toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    const { container } = render(
      <VerificationStatusIndicator userId="test-user" className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
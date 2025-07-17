import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VerificationStatusCard } from '../VerificationStatusCard'
import { useVerificationStatus } from '@/lib/hooks/use-verification-status'

// Mock the verification status hook
vi.mock('@/lib/hooks/use-verification-status')
const mockUseVerificationStatus = vi.mocked(useVerificationStatus)

describe('VerificationStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: true,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Checking...')).toBeInTheDocument()
    expect(screen.getByText('Verification Status')).toBeInTheDocument()
  })

  it('renders complete verification status correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    expect(screen.getByText('Your account is fully verified and you can access all washer features.')).toBeInTheDocument()
    expect(screen.getByText('Account ID: acct_test123')).toBeInTheDocument()
  })

  it('renders pending verification status correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'pending',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('Your verification is being processed. This may take a few business days.')).toBeInTheDocument()
    expect(screen.getByText('⚠️ Some washer features may be limited until verification is complete.')).toBeInTheDocument()
  })

  it('renders requires action status correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'requires_action',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Action Required')).toBeInTheDocument()
    expect(screen.getByText('REQUIRES_ACTION')).toBeInTheDocument()
    expect(screen.getByText('Additional information is needed to complete your verification.')).toBeInTheDocument()
    expect(screen.getByText('⚠️ Some washer features may be limited until verification is complete.')).toBeInTheDocument()
  })

  it('renders rejected status correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'rejected',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
    expect(screen.getByText('Your verification was not successful. Please contact support for assistance.')).toBeInTheDocument()
  })

  it('renders incomplete status correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Not Verified')).toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
    expect(screen.getByText('Complete your Stripe Connect verification to access washer features.')).toBeInTheDocument()
    expect(screen.getByText('⚠️ Some washer features may be limited until verification is complete.')).toBeInTheDocument()
  })

  it('renders compact version correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" compact={true} />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    // Should not show title in compact mode
    expect(screen.queryByText('Verification Status')).not.toBeInTheDocument()
    // Should show description in compact mode with new component
    expect(screen.getByText('Your account is fully verified and you can access all washer features.')).toBeInTheDocument()
  })

  it('hides title when showTitle is false', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      accountId: 'acct_test123',
      isLoading: false,
    })

    render(<VerificationStatusCard userId="test-user-id" showTitle={false} />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.queryByText('Verification Status')).not.toBeInTheDocument()
  })

  it('handles error state correctly', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
      error: 'Failed to fetch verification status',
    })

    render(<VerificationStatusCard userId="test-user-id" />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
    expect(screen.getByText('Unable to check verification status')).toBeInTheDocument()
  })

  it('does not render when userId is not provided', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
      error: 'No user ID provided',
    })

    render(<VerificationStatusCard />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Unable to check verification status')).toBeInTheDocument()
  })
})
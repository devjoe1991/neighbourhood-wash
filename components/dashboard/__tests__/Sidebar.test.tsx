import { render, screen, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Sidebar from '../Sidebar'
import { useVerificationStatus } from '@/lib/hooks/use-verification-status'
import { createClient } from '@/utils/supabase/client'
import { vi } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/utils/supabase/client')
const mockCreateClient = createClient as ReturnType<typeof vi.mocked>

// Mock the verification status hook
vi.mock('@/lib/hooks/use-verification-status')
const mockUseVerificationStatus = useVerificationStatus as ReturnType<typeof vi.mocked>

// Mock Supabase auth
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePathname as ReturnType<typeof vi.mocked>).mockReturnValue('/user/dashboard')
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('renders basic sidebar for regular users', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="user" />)

    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('New Booking')).toBeInTheDocument()
    expect(screen.getByText('My Bookings')).toBeInTheDocument()
    
    // Should not show verification status for regular users
    expect(screen.queryByText('Verification Status')).not.toBeInTheDocument()
  })

  it('renders verification status for verified washers', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    // All washer links should be enabled
    expect(screen.getByText('Available Bookings')).toBeInTheDocument()
    expect(screen.getByText('Payouts')).toBeInTheDocument()
    
    // Should not show shield icons for enabled links
    expect(screen.queryByTitle('Complete verification to access this feature')).not.toBeInTheDocument()
  })

  it('disables washer-specific links for unverified washers', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Not Verified')).toBeInTheDocument()
    })

    // Washer-specific links should be disabled
    const disabledLinks = screen.getAllByTitle('Complete verification to access this feature')
    expect(disabledLinks.length).toBeGreaterThan(0)
    
    // Should show shield icons for disabled links
    const shieldIcons = screen.getAllByTitle('Complete verification to access this feature')
    expect(shieldIcons.length).toBeGreaterThan(0)
  })

  it('shows pending verification status correctly', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'pending',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Verification under review')).toBeInTheDocument()
    })
  })

  it('shows requires action verification status correctly', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'requires_action',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Action Required')).toBeInTheDocument()
    })
  })

  it('shows loading state while checking verification', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: true,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Checking...')).toBeInTheDocument()
    })
  })

  it('handles mobile version correctly', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" isMobile={true} />)

    // Should still show verification status in mobile
    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
    })
  })

  it('handles user authentication error gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
      error: 'No user ID provided',
    })

    render(<Sidebar userRole="washer" />)

    // Should still render sidebar even with auth error
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
  })

  it('shows correct active state for current path', () => {
    ;(usePathname as ReturnType<typeof vi.mocked>).mockReturnValue('/washer/dashboard/bookings')
    
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    // The My Bookings link should be active
    const bookingsLink = screen.getByText('My Bookings').closest('a')
    expect(bookingsLink).toHaveClass('bg-blue-600', 'text-white')
  })

  it('hides become washer link for existing washers', () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    expect(screen.queryByText('Become a Washer')).not.toBeInTheDocument()
  })

  it('shows become washer link for regular users', () => {
    render(<Sidebar userRole="user" />)

    expect(screen.getByText('Become a Washer')).toBeInTheDocument()
  })

  it('shows error state when verification status check fails', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
      error: 'Failed to check verification status',
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to check verification status')).toBeInTheDocument()
    })
  })

  it('shows rejected verification status correctly', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'rejected',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeInTheDocument()
      expect(screen.getByText('Contact support for help')).toBeInTheDocument()
    })
  })

  it('shows complete verification status with correct description', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: true,
      status: 'complete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Verified')).toBeInTheDocument()
      expect(screen.getByText('All features available')).toBeInTheDocument()
    })
  })

  it('shows not verified status with correct description', async () => {
    mockUseVerificationStatus.mockReturnValue({
      canAccess: false,
      status: 'incomplete',
      isLoading: false,
    })

    render(<Sidebar userRole="washer" />)

    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument()
      expect(screen.getByText('Not Verified')).toBeInTheDocument()
      expect(screen.getByText('Complete verification to start')).toBeInTheDocument()
    })
  })
})
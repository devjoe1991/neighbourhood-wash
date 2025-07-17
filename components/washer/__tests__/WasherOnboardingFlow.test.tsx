import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WasherOnboardingFlow } from '../WasherOnboardingFlow'

// Mock the server actions
vi.mock('@/lib/stripe/actions', () => ({
  getOnboardingStatus: vi.fn(),
  saveProfileSetup: vi.fn(),
}))

import { getOnboardingStatus, saveProfileSetup } from '@/lib/stripe/actions'

describe('WasherOnboardingFlow Component', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' }
  const mockProfile = { id: 'user123', role: 'washer' } as any
  const mockOnStepComplete = vi.fn()
  const mockOnOnboardingComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    vi.mocked(getOnboardingStatus).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false
        }
      }), 100))
    )

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    expect(screen.getByText('Loading onboarding status...')).toBeInTheDocument()
  })

  it('should render Step 1 profile setup form', async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({
      success: true,
      data: {
        currentStep: 1,
        completedSteps: [],
        isComplete: false
      }
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    expect(screen.getByText('Profile & Service Setup')).toBeInTheDocument()
    expect(screen.getByLabelText('Service Area *')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument()
    expect(screen.getByLabelText('About You *')).toBeInTheDocument()
  })

  it('should validate required fields in Step 1', async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({
      success: true,
      data: {
        currentStep: 1,
        completedSteps: [],
        isComplete: false
      }
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Complete Profile Setup')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Service area is required')).toBeInTheDocument()
    })

    expect(vi.mocked(saveProfileSetup)).not.toHaveBeenCalled()
  })

  it('should submit valid profile data', async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({
      success: true,
      data: {
        currentStep: 1,
        completedSteps: [],
        isComplete: false
      }
    })

    vi.mocked(saveProfileSetup).mockResolvedValue({
      success: true,
      data: { step: 1 },
      message: 'Profile setup completed successfully'
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Service Area *'), {
      target: { value: 'Central London' }
    })
    fireEvent.change(screen.getByLabelText('Phone Number *'), {
      target: { value: '+44 7123 456789' }
    })
    fireEvent.change(screen.getByLabelText('About You *'), {
      target: { value: 'Experienced washer with 5 years in the industry' }
    })

    // Select availability and service types
    const washDryCheckbox = screen.getByLabelText('Wash & Dry')
    fireEvent.click(washDryCheckbox)

    const mondayMorningCheckbox = screen.getByLabelText('Monday Morning')
    fireEvent.click(mondayMorningCheckbox)

    // Submit the form
    const submitButton = screen.getByText('Complete Profile Setup')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(vi.mocked(saveProfileSetup)).toHaveBeenCalledWith('user123', {
        serviceArea: 'Central London',
        availability: ['Monday Morning'],
        serviceTypes: ['Wash & Dry'],
        preferences: '',
        bio: 'Experienced washer with 5 years in the industry',
        phoneNumber: '+44 7123 456789'
      })
    })

    expect(mockOnStepComplete).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('should show completion state when onboarding is complete', async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({
      success: true,
      data: {
        currentStep: 4,
        completedSteps: [1, 2, 3, 4],
        isComplete: true
      }
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Onboarding Complete!')).toBeInTheDocument()
    })

    expect(screen.getByText('You now have full access to all washer features')).toBeInTheDocument()
    expect(screen.getByText('Access Full Dashboard')).toBeInTheDocument()
  })
})
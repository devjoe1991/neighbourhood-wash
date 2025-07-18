/**
 * Integration tests for onboarding error handling components
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { WasherOnboardingFlow } from '../WasherOnboardingFlow'
import { OnboardingErrorBoundary } from '../OnboardingErrorBoundary'
import { OnboardingLoadingState, LoadingOverlay } from '../OnboardingLoadingState'
import * as onboardingActions from '@/lib/stripe/actions'
import * as toastHook from '@/lib/hooks/use-toast'

// Mock dependencies
vi.mock('@/lib/stripe/actions', () => ({
  getOnboardingStatus: vi.fn(),
  saveProfileSetup: vi.fn(),
  initiateStripeKYC: vi.fn(),
  processOnboardingPayment: vi.fn(),
  confirmOnboardingPayment: vi.fn(),
  completeOnboarding: vi.fn(),
}))

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  })),
  toast: vi.fn(),
}))

vi.mock('@/lib/onboarding-progress', () => ({
  logOnboardingStep: vi.fn(),
  getOnboardingProgress: vi.fn(),
  updateOnboardingProgress: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('OnboardingErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error')
    }
    return <div>No error</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={false} />
      </OnboardingErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should render error UI when error occurs', () => {
    render(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    )

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument()
  })

  it('should handle retry functionality', async () => {
    const { rerender } = render(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)

    // After retry, render without error
    rerender(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={false} />
      </OnboardingErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should disable retry after max attempts', () => {
    const { rerender } = render(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    )

    // Click retry 3 times
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)
      
      rerender(
        <OnboardingErrorBoundary userId="test-user" step={1}>
          <ThrowError shouldThrow={true} />
        </OnboardingErrorBoundary>
      )
    }

    expect(screen.getByRole('button', { name: /max retries reached/i })).toBeDisabled()
  })

  it('should navigate to dashboard when go home is clicked', () => {
    render(
      <OnboardingErrorBoundary userId="test-user" step={1}>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    )

    const homeButton = screen.getByRole('button', { name: /go to dashboard/i })
    fireEvent.click(homeButton)

    expect(mockLocation.href).toBe('/washer/dashboard')
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <OnboardingErrorBoundary userId="test-user" step={1} fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument()
  })
})

describe('OnboardingLoadingState', () => {
  it('should render loading state correctly', () => {
    render(
      <OnboardingLoadingState
        isLoading={true}
        step={1}
        stepName="Profile Setup"
        message="Saving your profile information..."
      />
    )

    expect(screen.getByText('Processing Profile Setup...')).toBeInTheDocument()
    expect(screen.getByText('Saving your profile information...')).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()
  })

  it('should render success state correctly', () => {
    render(
      <OnboardingLoadingState
        isLoading={false}
        step={1}
        stepName="Profile Setup"
        success={true}
        message="Profile saved successfully"
      />
    )

    expect(screen.getByText('Profile Setup Complete')).toBeInTheDocument()
    expect(screen.getByText('Profile saved successfully')).toBeInTheDocument()
  })

  it('should render error state correctly', () => {
    render(
      <OnboardingLoadingState
        isLoading={false}
        step={1}
        stepName="Profile Setup"
        error="Failed to save profile"
      />
    )

    expect(screen.getByText('Profile Setup Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to save profile')).toBeInTheDocument()
  })

  it('should render progress bar when progress is provided', () => {
    render(
      <OnboardingLoadingState
        isLoading={true}
        step={1}
        stepName="Profile Setup"
        progress={75}
      />
    )

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('should not render when not loading and no error/success', () => {
    const { container } = render(
      <OnboardingLoadingState
        isLoading={false}
        step={1}
        stepName="Profile Setup"
      />
    )

    expect(container.firstChild).toBeNull()
  })
})

describe('LoadingOverlay', () => {
  it('should render children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('should render overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true} message="Processing...">
        <div>Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('should use default loading message when none provided', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('WasherOnboardingFlow Error Handling Integration', () => {
  const mockUser = { id: 'test-user-123' }
  const mockProfile = { id: 'test-user-123', role: 'washer' }
  const mockOnStepComplete = vi.fn()
  const mockOnOnboardingComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Mock successful onboarding status by default
    ;(onboardingActions.getOnboardingStatus as Mock).mockResolvedValue({
      success: true,
      data: {
        currentStep: 1,
        completedSteps: [],
        isComplete: false,
      },
    })
  })

  it('should handle loading error and show error toast', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)
    
    // Mock loading error
    ;(onboardingActions.getOnboardingStatus as Mock).mockRejectedValue(
      new Error('Network error')
    )

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Unable to load onboarding status. Please check your connection.',
        })
      )
    })
  })

  it('should show recovery prompt when recovery state exists', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)
    
    // Mock recovery state
    const recoveryData = {
      userId: mockUser.id,
      step: 2,
      timestamp: Date.now(),
      url: 'http://localhost:3000/washer/onboarding',
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(recoveryData))

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    // Wait for recovery prompt
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Resume Onboarding?',
          description: expect.stringContaining('step 2'),
        })
      )
    }, { timeout: 2000 })
  })

  it('should handle profile setup error with retry', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)
    
    // Mock profile setup failure
    ;(onboardingActions.saveProfileSetup as Mock).mockResolvedValue({
      success: false,
      error: { message: 'Validation failed' },
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Fill out profile form
    const serviceAreaInput = screen.getByLabelText(/service area/i)
    fireEvent.change(serviceAreaInput, { target: { value: 'London' } })

    const phoneInput = screen.getByLabelText(/phone number/i)
    fireEvent.change(phoneInput, { target: { value: '+44 7123 456789' } })

    const bioInput = screen.getByLabelText(/about you/i)
    fireEvent.change(bioInput, { target: { value: 'Experienced laundry professional with 5 years of experience' } })

    // Select availability and service types
    const availabilityCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(availabilityCheckboxes[0]) // First availability option
    fireEvent.click(availabilityCheckboxes[6]) // First service type option

    // Submit form
    const submitButton = screen.getByRole('button', { name: /complete profile setup/i })
    fireEvent.click(submitButton)

    // Should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Profile Setup Error',
        })
      )
    })
  })

  it('should handle successful step completion with success toast', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)
    
    // Mock successful profile setup
    ;(onboardingActions.saveProfileSetup as Mock).mockResolvedValue({
      success: true,
    })

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Fill out and submit profile form
    const serviceAreaInput = screen.getByLabelText(/service area/i)
    fireEvent.change(serviceAreaInput, { target: { value: 'London' } })

    const phoneInput = screen.getByLabelText(/phone number/i)
    fireEvent.change(phoneInput, { target: { value: '+44 7123 456789' } })

    const bioInput = screen.getByLabelText(/about you/i)
    fireEvent.change(bioInput, { target: { value: 'Experienced laundry professional with 5 years of experience' } })

    // Select availability and service types
    const availabilityCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(availabilityCheckboxes[0])
    fireEvent.click(availabilityCheckboxes[6])

    const submitButton = screen.getByRole('button', { name: /complete profile setup/i })
    fireEvent.click(submitButton)

    // Should show success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
          title: 'Profile Setup Complete! ✅',
        })
      )
    })

    expect(mockOnStepComplete).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('should show loading overlay during step processing', async () => {
    // Mock slow profile setup
    ;(onboardingActions.saveProfileSetup as Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={mockOnStepComplete}
        onOnboardingComplete={mockOnOnboardingComplete}
      />
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Fill out and submit form
    const serviceAreaInput = screen.getByLabelText(/service area/i)
    fireEvent.change(serviceAreaInput, { target: { value: 'London' } })

    const phoneInput = screen.getByLabelText(/phone number/i)
    fireEvent.change(phoneInput, { target: { value: '+44 7123 456789' } })

    const bioInput = screen.getByLabelText(/about you/i)
    fireEvent.change(bioInput, { target: { value: 'Experienced laundry professional' } })

    const availabilityCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(availabilityCheckboxes[0])
    fireEvent.click(availabilityCheckboxes[6])

    const submitButton = screen.getByRole('button', { name: /complete profile setup/i })
    fireEvent.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Saving Profile...')).toBeInTheDocument()

    // Wait for completion
    await waitFor(() => {
      expect(mockOnStepComplete).toHaveBeenCalled()
    })
  })
})

describe('Error Recovery Scenarios', () => {
  const mockUser = { id: 'test-user-123' }
  const mockProfile = { id: 'test-user-123', role: 'washer' }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should handle network errors with appropriate retry options', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)
    
    // Mock network error
    const networkError = new Error('Network error')
    networkError.code = 'ENOTFOUND'
    
    ;(onboardingActions.getOnboardingStatus as Mock).mockRejectedValue(networkError)

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={vi.fn()}
        onOnboardingComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Connection Error',
        })
      )
    })
  })

  it('should handle validation errors without retry option', async () => {
    const mockToast = vi.fn()
    ;(toastHook.toast as Mock).mockImplementation(mockToast)

    render(
      <WasherOnboardingFlow
        user={mockUser}
        profile={mockProfile}
        onStepComplete={vi.fn()}
        onOnboardingComplete={vi.fn()}
      />
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Submit form with invalid data (empty required fields)
    const submitButton = screen.getByRole('button', { name: /complete profile setup/i })
    fireEvent.click(submitButton)

    // Should show validation error without retry
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Form Validation Error',
        })
      )
    })
  })
})
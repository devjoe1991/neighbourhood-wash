import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WasherOnboardingFlow } from '../WasherOnboardingFlow'

// Mock the server actions
vi.mock('@/lib/stripe/actions', () => ({
  getOnboardingStatus: vi.fn(),
  saveProfileSetup: vi.fn(),
  initiateStripeKYC: vi.fn(),
  processOnboardingPayment: vi.fn(),
  confirmOnboardingPayment: vi.fn(),
}))

// Mock error handling
vi.mock('@/lib/onboarding-error-handling', () => ({
  useOnboardingErrorHandler: () => ({
    executeWithRetry: vi.fn((fn) => fn()),
    handleError: vi.fn(),
  }),
  OnboardingRecovery: {
    getRecoveryState: vi.fn(),
    saveRecoveryState: vi.fn(),
    clearRecoveryState: vi.fn(),
    showRecoveryPrompt: vi.fn(),
  },
}))

// Mock toast notifications
vi.mock('@/components/ui/toast-with-action', () => ({
  OnboardingToasts: {
    showSuccessToast: vi.fn(),
    profileSetupStart: vi.fn(() => ({ dismiss: vi.fn() })),
    profileSetupSuccess: vi.fn(),
    profileSetupError: vi.fn(),
    kycStart: vi.fn(() => ({ dismiss: vi.fn() })),
    kycError: vi.fn(),
    bankConnectionStart: vi.fn(() => ({ dismiss: vi.fn() })),
    bankConnectionError: vi.fn(),
    paymentStart: vi.fn(() => ({ dismiss: vi.fn() })),
    paymentError: vi.fn(),
    onboardingComplete: vi.fn(),
  },
  showErrorToastWithRetry: vi.fn(),
  showStepCompletionToast: vi.fn(),
}))

import { 
  getOnboardingStatus,
  saveProfileSetup,
  initiateStripeKYC,
  processOnboardingPayment,
  confirmOnboardingPayment
} from '@/lib/stripe/actions'

import { OnboardingRecovery } from '@/lib/onboarding-error-handling'

describe('WasherOnboardingFlow Enhanced Tests', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' }
  const mockProfile = { id: 'user123', role: 'washer' } as any
  const mockOnStepComplete = vi.fn()
  const mockOnOnboardingComplete = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should load onboarding status on mount', async () => {
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

      expect(screen.getByText('Loading onboarding status...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
      })

      expect(vi.mocked(getOnboardingStatus)).toHaveBeenCalledWith('user123')
    })

    it('should handle onboarding status loading error', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: false,
        error: {
          type: 'network_error',
          message: 'Failed to load onboarding status'
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
        expect(screen.getByText('Failed to load onboarding status')).toBeInTheDocument()
      })
    })

    it('should check for recovery state on mount', async () => {
      const mockRecoveryState = {
        userId: 'user123',
        step: 2,
        data: { some: 'data' },
        timestamp: Date.now()
      }

      vi.mocked(OnboardingRecovery.getRecoveryState).mockReturnValue(mockRecoveryState)
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
        expect(vi.mocked(OnboardingRecovery.getRecoveryState)).toHaveBeenCalled()
      })

      // Simulate recovery prompt after delay
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(vi.mocked(OnboardingRecovery.showRecoveryPrompt)).toHaveBeenCalledWith(
        2,
        expect.any(Function),
        expect.any(Function)
      )
    })
  })

  describe('Progress Tracking', () => {
    it('should display correct progress percentage', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 3,
          completedSteps: [1, 2],
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
        expect(screen.getByText('50% Complete')).toBeInTheDocument()
      })

      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    })

    it('should show step indicators with correct states', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 3,
          completedSteps: [1, 2],
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

      // Check that step indicators are rendered
      const stepIndicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('rounded-full')
      )
      expect(stepIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('Step Transitions', () => {
    it('should handle step completion with loading states', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false
        }
      })

      vi.mocked(saveProfileSetup).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { step: 1 },
          message: 'Profile setup completed successfully'
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

      await waitFor(() => {
        expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
      })

      // Fill in profile form
      const serviceAreaInput = screen.getByLabelText('Service Area *')
      const phoneInput = screen.getByLabelText('Phone Number *')
      const bioInput = screen.getByLabelText('About You *')

      await user.type(serviceAreaInput, 'Central London')
      await user.type(phoneInput, '+44 7123 456789')
      await user.type(bioInput, 'Experienced washer with 5 years in the industry')

      // Select availability and service types
      const washDryCheckbox = screen.getByLabelText('Wash & Dry')
      const mondayMorningCheckbox = screen.getByLabelText('Monday Morning')
      
      await user.click(washDryCheckbox)
      await user.click(mondayMorningCheckbox)

      // Submit form
      const submitButton = screen.getByText('Complete Profile Setup')
      await user.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Saving Profile...')).toBeInTheDocument()
      })

      // Wait for completion
      await waitFor(() => {
        expect(vi.mocked(saveProfileSetup)).toHaveBeenCalled()
      })
    })

    it('should handle step completion errors with retry', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false
        }
      })

      vi.mocked(saveProfileSetup).mockResolvedValue({
        success: false,
        error: {
          type: 'network_error',
          message: 'Network connection failed'
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

      // Fill and submit form
      const serviceAreaInput = screen.getByLabelText('Service Area *')
      await user.type(serviceAreaInput, 'Central London')

      const phoneInput = screen.getByLabelText('Phone Number *')
      await user.type(phoneInput, '+44 7123 456789')

      const bioInput = screen.getByLabelText('About You *')
      await user.type(bioInput, 'Experienced washer with 5 years in the industry')

      const washDryCheckbox = screen.getByLabelText('Wash & Dry')
      const mondayMorningCheckbox = screen.getByLabelText('Monday Morning')
      
      await user.click(washDryCheckbox)
      await user.click(mondayMorningCheckbox)

      const submitButton = screen.getByText('Complete Profile Setup')
      await user.click(submitButton)

      await waitFor(() => {
        expect(vi.mocked(saveProfileSetup)).toHaveBeenCalled()
      })

      // Should not proceed to next step on error
      expect(mockOnStepComplete).not.toHaveBeenCalled()
    })
  })

  describe('Completion State', () => {
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

    it('should handle dashboard access button click', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 4,
          completedSteps: [1, 2, 3, 4],
          isComplete: true
        }
      })

      // Mock window.location.reload
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
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
        expect(screen.getByText('Access Full Dashboard')).toBeInTheDocument()
      })

      const accessButton = screen.getByText('Access Full Dashboard')
      await user.click(accessButton)

      expect(mockReload).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should display error state with retry option', async () => {
      vi.mocked(getOnboardingStatus).mockRejectedValue(new Error('Network error'))

      render(
        <WasherOnboardingFlow
          user={mockUser}
          profile={mockProfile}
          onStepComplete={mockOnStepComplete}
          onOnboardingComplete={mockOnOnboardingComplete}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should save recovery state on step interruption', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false
        }
      })

      vi.mocked(saveProfileSetup).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { step: 1 }
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

      await waitFor(() => {
        expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
      })

      // Fill and submit form to trigger recovery state save
      const serviceAreaInput = screen.getByLabelText('Service Area *')
      await user.type(serviceAreaInput, 'Central London')

      const phoneInput = screen.getByLabelText('Phone Number *')
      await user.type(phoneInput, '+44 7123 456789')

      const bioInput = screen.getByLabelText('About You *')
      await user.type(bioInput, 'Experienced washer with 5 years in the industry')

      const washDryCheckbox = screen.getByLabelText('Wash & Dry')
      const mondayMorningCheckbox = screen.getByLabelText('Monday Morning')
      
      await user.click(washDryCheckbox)
      await user.click(mondayMorningCheckbox)

      const submitButton = screen.getByText('Complete Profile Setup')
      await user.click(submitButton)

      await waitFor(() => {
        expect(vi.mocked(OnboardingRecovery.saveRecoveryState)).toHaveBeenCalledWith(
          'user123',
          1,
          expect.any(Object)
        )
      })
    })

    it('should clear recovery state on completion', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 4,
          completedSteps: [1, 2, 3],
          isComplete: false
        }
      })

      vi.mocked(processOnboardingPayment).mockResolvedValue({
        success: true,
        paymentIntentId: 'pi_test123'
      })

      vi.mocked(confirmOnboardingPayment).mockResolvedValue({
        success: true,
        data: { status: 'succeeded' }
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
        expect(screen.getByText('Pay £15 Now')).toBeInTheDocument()
      })

      const payButton = screen.getByText('Pay £15 Now')
      await user.click(payButton)

      await waitFor(() => {
        expect(vi.mocked(OnboardingRecovery.clearRecoveryState)).toHaveBeenCalled()
      })
    })
  })

  describe('Step Navigation', () => {
    it('should handle back navigation between steps', async () => {
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 2,
          completedSteps: [1],
          isComplete: false,
          stripeAccountId: 'acct_test123'
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
        expect(screen.getByText('Stripe Connect KYC')).toBeInTheDocument()
      })

      const backButton = screen.getByText('Back')
      await user.click(backButton)

      // Should transition back to previous step
      await waitFor(() => {
        expect(screen.getByText('Profile & Service Setup')).toBeInTheDocument()
      })
    })

    it('should not allow back navigation from first step', async () => {
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
        expect(screen.getByText('Profile & Service Setup')).toBeInTheDocument()
      })

      // First step should not have a back button
      expect(screen.queryByText('Back')).not.toBeInTheDocument()
    })
  })

  describe('Data Persistence', () => {
    it('should populate form with existing profile data', async () => {
      const existingProfileData = {
        serviceArea: 'Manchester',
        availability: ['Tuesday Morning', 'Wednesday Afternoon'],
        serviceTypes: ['Wash Only', 'Dry Only'],
        preferences: 'Existing preferences',
        bio: 'Existing bio with sufficient length',
        phoneNumber: '+44 7987 654321'
      }

      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false,
          profileData: existingProfileData
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
        expect(screen.getByDisplayValue('Manchester')).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('+44 7987 654321')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing bio with sufficient length')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing preferences')).toBeInTheDocument()
    })
  })
})
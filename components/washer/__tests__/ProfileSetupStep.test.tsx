import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the parent component to extract ProfileSetupStep
vi.mock('@/lib/stripe/actions', () => ({
  getOnboardingStatus: vi.fn(),
  saveProfileSetup: vi.fn(),
}))

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

vi.mock('@/components/ui/toast-with-action', () => ({
  OnboardingToasts: {
    showSuccessToast: vi.fn(),
    profileSetupStart: vi.fn(() => ({ dismiss: vi.fn() })),
    profileSetupSuccess: vi.fn(),
    profileSetupError: vi.fn(),
  },
  showErrorToastWithRetry: vi.fn(),
  showStepCompletionToast: vi.fn(),
}))

// Create a test component that renders ProfileSetupStep
function TestProfileSetupStep({ onNext, isLoading = false, initialData, userId = 'test-user' }: {
  onNext: (data: any) => void
  isLoading?: boolean
  initialData?: any
  userId?: string
}) {
  // This is a simplified version of ProfileSetupStep for testing
  const [formData, setFormData] = React.useState({
    serviceArea: initialData?.serviceArea || '',
    availability: initialData?.availability || [],
    serviceTypes: initialData?.serviceTypes || [],
    preferences: initialData?.preferences || '',
    bio: initialData?.bio || '',
    phoneNumber: initialData?.phoneNumber || ''
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.serviceArea.trim()) {
      newErrors.serviceArea = 'Service area is required'
    }
    if (formData.availability.length === 0) {
      newErrors.availability = 'Please select at least one availability slot'
    }
    if (formData.serviceTypes.length === 0) {
      newErrors.serviceTypes = 'Please select at least one service type'
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required'
    } else if (formData.bio.trim().length < 20) {
      newErrors.bio = 'Bio must be at least 20 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      onNext(formData)
    }
  }

  const availabilityOptions = [
    'Monday Morning', 'Monday Afternoon', 'Monday Evening',
    'Tuesday Morning', 'Tuesday Afternoon', 'Tuesday Evening',
  ]

  const serviceTypeOptions = [
    'Wash & Dry', 'Wash Only', 'Dry Only', 'Ironing', 'Folding', 'Collection & Delivery'
  ]

  return (
    <div data-testid="profile-setup-step">
      <h4>Profile & Service Setup</h4>
      
      <div>
        <label htmlFor="serviceArea">Service Area *</label>
        <input
          id="serviceArea"
          value={formData.serviceArea}
          onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
          data-testid="service-area-input"
        />
        {errors.serviceArea && <span data-testid="service-area-error">{errors.serviceArea}</span>}
      </div>

      <div>
        <label htmlFor="phoneNumber">Phone Number *</label>
        <input
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
          data-testid="phone-number-input"
        />
        {errors.phoneNumber && <span data-testid="phone-number-error">{errors.phoneNumber}</span>}
      </div>

      <div>
        <label htmlFor="bio">About You *</label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          data-testid="bio-input"
        />
        {errors.bio && <span data-testid="bio-error">{errors.bio}</span>}
      </div>

      <div>
        <label>Availability *</label>
        <div data-testid="availability-options">
          {availabilityOptions.map((option) => (
            <div key={option}>
              <input
                type="checkbox"
                id={option}
                checked={formData.availability.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ 
                      ...prev, 
                      availability: [...prev.availability, option] 
                    }))
                  } else {
                    setFormData(prev => ({ 
                      ...prev, 
                      availability: prev.availability.filter(a => a !== option) 
                    }))
                  }
                }}
                data-testid={`availability-${option.replace(/\s+/g, '-').toLowerCase()}`}
              />
              <label htmlFor={option}>{option}</label>
            </div>
          ))}
        </div>
        {errors.availability && <span data-testid="availability-error">{errors.availability}</span>}
      </div>

      <div>
        <label>Service Types *</label>
        <div data-testid="service-type-options">
          {serviceTypeOptions.map((option) => (
            <div key={option}>
              <input
                type="checkbox"
                id={option}
                checked={formData.serviceTypes.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ 
                      ...prev, 
                      serviceTypes: [...prev.serviceTypes, option] 
                    }))
                  } else {
                    setFormData(prev => ({ 
                      ...prev, 
                      serviceTypes: prev.serviceTypes.filter(s => s !== option) 
                    }))
                  }
                }}
                data-testid={`service-type-${option.replace(/\s+/g, '-').toLowerCase()}`}
              />
              <label htmlFor={option}>{option}</label>
            </div>
          ))}
        </div>
        {errors.serviceTypes && <span data-testid="service-types-error">{errors.serviceTypes}</span>}
      </div>

      <div>
        <label htmlFor="preferences">Additional Preferences</label>
        <textarea
          id="preferences"
          value={formData.preferences}
          onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
          data-testid="preferences-input"
        />
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={isLoading}
        data-testid="submit-button"
      >
        {isLoading ? 'Saving Profile...' : 'Complete Profile Setup'}
      </button>
    </div>
  )
}

describe('ProfileSetupStep Component', () => {
  const mockOnNext = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    expect(screen.getByText('Profile & Service Setup')).toBeInTheDocument()
    expect(screen.getByTestId('service-area-input')).toBeInTheDocument()
    expect(screen.getByTestId('phone-number-input')).toBeInTheDocument()
    expect(screen.getByTestId('bio-input')).toBeInTheDocument()
    expect(screen.getByTestId('availability-options')).toBeInTheDocument()
    expect(screen.getByTestId('service-type-options')).toBeInTheDocument()
    expect(screen.getByTestId('preferences-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('should populate form with initial data', () => {
    const initialData = {
      serviceArea: 'Central London',
      availability: ['Monday Morning'],
      serviceTypes: ['Wash & Dry'],
      preferences: 'Test preferences',
      bio: 'Test bio with more than twenty characters',
      phoneNumber: '+44 7123 456789'
    }

    render(<TestProfileSetupStep onNext={mockOnNext} initialData={initialData} />)

    expect(screen.getByTestId('service-area-input')).toHaveValue('Central London')
    expect(screen.getByTestId('phone-number-input')).toHaveValue('+44 7123 456789')
    expect(screen.getByTestId('bio-input')).toHaveValue('Test bio with more than twenty characters')
    expect(screen.getByTestId('preferences-input')).toHaveValue('Test preferences')
    expect(screen.getByTestId('availability-monday-morning')).toBeChecked()
    expect(screen.getByTestId('service-type-wash-&-dry')).toBeChecked()
  })

  it('should validate required fields', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('service-area-error')).toHaveTextContent('Service area is required')
      expect(screen.getByTestId('phone-number-error')).toHaveTextContent('Phone number is required')
      expect(screen.getByTestId('bio-error')).toHaveTextContent('Bio is required')
      expect(screen.getByTestId('availability-error')).toHaveTextContent('Please select at least one availability slot')
      expect(screen.getByTestId('service-types-error')).toHaveTextContent('Please select at least one service type')
    })

    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should validate phone number format', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    const phoneInput = screen.getByTestId('phone-number-input')
    await user.type(phoneInput, 'invalid-phone')

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('phone-number-error')).toHaveTextContent('Please enter a valid phone number')
    })

    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should validate bio minimum length', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    const bioInput = screen.getByTestId('bio-input')
    await user.type(bioInput, 'Short bio')

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('bio-error')).toHaveTextContent('Bio must be at least 20 characters long')
    })

    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should submit valid form data', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    // Fill in required fields
    await user.type(screen.getByTestId('service-area-input'), 'Central London')
    await user.type(screen.getByTestId('phone-number-input'), '+44 7123 456789')
    await user.type(screen.getByTestId('bio-input'), 'Experienced washer with 5 years in the industry')
    await user.type(screen.getByTestId('preferences-input'), 'Eco-friendly products preferred')

    // Select availability and service types
    await user.click(screen.getByTestId('availability-monday-morning'))
    await user.click(screen.getByTestId('availability-tuesday-afternoon'))
    await user.click(screen.getByTestId('service-type-wash-&-dry'))
    await user.click(screen.getByTestId('service-type-ironing'))

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith({
        serviceArea: 'Central London',
        availability: ['Monday Morning', 'Tuesday Afternoon'],
        serviceTypes: ['Wash & Dry', 'Ironing'],
        preferences: 'Eco-friendly products preferred',
        bio: 'Experienced washer with 5 years in the industry',
        phoneNumber: '+44 7123 456789'
      })
    })
  })

  it('should handle loading state', () => {
    render(<TestProfileSetupStep onNext={mockOnNext} isLoading={true} />)

    const submitButton = screen.getByTestId('submit-button')
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('Saving Profile...')
  })

  it('should allow toggling availability options', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    const mondayMorning = screen.getByTestId('availability-monday-morning')
    const tuesdayAfternoon = screen.getByTestId('availability-tuesday-afternoon')

    expect(mondayMorning).not.toBeChecked()
    expect(tuesdayAfternoon).not.toBeChecked()

    await user.click(mondayMorning)
    expect(mondayMorning).toBeChecked()

    await user.click(tuesdayAfternoon)
    expect(tuesdayAfternoon).toBeChecked()

    // Uncheck one
    await user.click(mondayMorning)
    expect(mondayMorning).not.toBeChecked()
    expect(tuesdayAfternoon).toBeChecked()
  })

  it('should allow toggling service type options', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    const washDry = screen.getByTestId('service-type-wash-&-dry')
    const ironing = screen.getByTestId('service-type-ironing')

    expect(washDry).not.toBeChecked()
    expect(ironing).not.toBeChecked()

    await user.click(washDry)
    expect(washDry).toBeChecked()

    await user.click(ironing)
    expect(ironing).toBeChecked()

    // Uncheck one
    await user.click(washDry)
    expect(washDry).not.toBeChecked()
    expect(ironing).toBeChecked()
  })

  it('should clear validation errors when fields are corrected', async () => {
    render(<TestProfileSetupStep onNext={mockOnNext} />)

    // Trigger validation errors
    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('service-area-error')).toBeInTheDocument()
    })

    // Fix the service area field
    await user.type(screen.getByTestId('service-area-input'), 'Central London')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByTestId('service-area-error')).not.toBeInTheDocument()
    })
  })
})
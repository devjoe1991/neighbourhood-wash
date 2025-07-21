import { OnboardingStatus, ProfileSetupData } from './onboarding-service'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Validate profile setup data
 */
export function validateProfileSetup(data: ProfileSetupData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!data.firstName?.trim()) {
    errors.push('First name is required')
  }

  if (!data.lastName?.trim()) {
    errors.push('Last name is required')
  }

  if (!data.phoneNumber?.trim()) {
    errors.push('Phone number is required')
  } else {
    // UK phone number validation
    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/
    if (!phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
      errors.push('Please enter a valid UK phone number')
    }
  }

  if (!data.serviceArea?.trim()) {
    errors.push('Service area is required')
  }

  if (!data.availability || data.availability.length === 0) {
    errors.push('Please select at least one availability slot')
  } else if (data.availability.length < 3) {
    warnings.push('Consider adding more availability slots to get more bookings')
  }

  if (!data.serviceTypes || data.serviceTypes.length === 0) {
    errors.push('Please select at least one service type')
  }

  // Optional field validation
  if (data.bio && data.bio.length > 500) {
    errors.push('Bio must be less than 500 characters')
  }

  // Name validation
  if (data.firstName && data.firstName.length < 2) {
    errors.push('First name must be at least 2 characters')
  }

  if (data.lastName && data.lastName.length < 2) {
    errors.push('Last name must be at least 2 characters')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate onboarding step transition
 */
export function validateStepTransition(
  currentStep: OnboardingStatus,
  targetStep: OnboardingStatus
): ValidationResult {
  const errors: string[] = []

  const validTransitions: Record<OnboardingStatus, OnboardingStatus[]> = {
    not_started: ['profile_setup'],
    profile_setup: ['verification_pending'],
    verification_pending: ['verification_complete'],
    verification_complete: ['payment_setup'],
    payment_setup: ['completed'],
    completed: [], // Terminal state
  }

  const allowedNextSteps = validTransitions[currentStep] || []

  if (!allowedNextSteps.includes(targetStep)) {
    errors.push(`Invalid transition from ${currentStep} to ${targetStep}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate onboarding completion requirements
 */
export function validateOnboardingCompletion(
  currentStep: OnboardingStatus,
  completedSteps: OnboardingStatus[],
  stripeAccountId?: string,
  stripeAccountStatus?: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const requiredSteps: OnboardingStatus[] = [
    'profile_setup',
    'verification_pending',
    'verification_complete',
    'payment_setup',
  ]

  // Check all required steps are completed
  for (const step of requiredSteps) {
    if (!completedSteps.includes(step)) {
      errors.push(`Step ${step} must be completed before finishing onboarding`)
    }
  }

  // Check current step is at completion
  if (currentStep !== 'completed' && currentStep !== 'payment_setup') {
    errors.push('Must complete all steps before finishing onboarding')
  }

  // Check Stripe account requirements
  if (!stripeAccountId) {
    errors.push('Stripe account must be created')
  } else if (stripeAccountStatus !== 'complete') {
    errors.push('Stripe account verification must be completed')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate service area (London boroughs)
 */
export function validateServiceArea(serviceArea: string): ValidationResult {
  const errors: string[] = []

  const londonBoroughs = [
    'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
    'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney', 'Hammersmith and Fulham',
    'Haringey', 'Harrow', 'Havering', 'Hillingdon', 'Hounslow', 'Islington',
    'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth', 'Lewisham',
    'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames', 'Southwark',
    'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
    'City of London',
  ]

  if (!serviceArea?.trim()) {
    errors.push('Service area is required')
  } else if (!londonBoroughs.includes(serviceArea)) {
    errors.push('Please select a valid London borough')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate availability slots
 */
export function validateAvailability(availability: string[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!availability || availability.length === 0) {
    errors.push('Please select at least one availability slot')
    return { isValid: false, errors }
  }

  // Check for minimum availability
  if (availability.length < 3) {
    warnings.push('Consider adding more availability slots to increase booking opportunities')
  }

  // Check for weekend availability
  const hasWeekendAvailability = availability.some(slot => 
    slot.includes('Saturday') || slot.includes('Sunday')
  )
  
  if (!hasWeekendAvailability) {
    warnings.push('Weekend availability can significantly increase your bookings')
  }

  // Check for evening availability
  const hasEveningAvailability = availability.some(slot => 
    slot.includes('5:00 PM - 8:00 PM')
  )
  
  if (!hasEveningAvailability) {
    warnings.push('Evening slots are popular with working customers')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate service types selection
 */
export function validateServiceTypes(serviceTypes: string[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const validServiceTypes = [
    'Standard Wash & Fold',
    'Delicate Items',
    'Bedding & Linens',
    'Dry Cleaning',
    'Ironing Service',
    'Express Service',
  ]

  if (!serviceTypes || serviceTypes.length === 0) {
    errors.push('Please select at least one service type')
    return { isValid: false, errors }
  }

  // Validate each service type
  for (const serviceType of serviceTypes) {
    if (!validServiceTypes.includes(serviceType)) {
      errors.push(`Invalid service type: ${serviceType}`)
    }
  }

  // Recommendations for better earnings
  if (!serviceTypes.includes('Express Service')) {
    warnings.push('Express Service typically earns 25% more per job')
  }

  if (!serviceTypes.includes('Bedding & Linens')) {
    warnings.push('Bedding & Linens are high-value items with good margins')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Get onboarding progress percentage
 */
export function calculateOnboardingProgress(
  currentStep: OnboardingStatus,
  completedSteps: OnboardingStatus[]
): number {
  const allSteps: OnboardingStatus[] = [
    'profile_setup',
    'verification_pending', 
    'verification_complete',
    'payment_setup'
  ]

  if (currentStep === 'completed') {
    return 100
  }

  if (currentStep === 'not_started') {
    return 0
  }

  const completedCount = completedSteps.filter(step => 
    allSteps.includes(step)
  ).length

  return Math.round((completedCount / allSteps.length) * 100)
}

/**
 * Get next recommended action for user
 */
export function getNextRecommendedAction(
  currentStep: OnboardingStatus,
  completedSteps: OnboardingStatus[]
): {
  action: string
  description: string
  priority: 'high' | 'medium' | 'low'
} {
  switch (currentStep) {
    case 'not_started':
      return {
        action: 'Start Profile Setup',
        description: 'Complete your profile and service preferences to begin',
        priority: 'high'
      }
    
    case 'profile_setup':
      return {
        action: 'Complete Identity Verification',
        description: 'Verify your identity with Stripe to receive payments',
        priority: 'high'
      }
    
    case 'verification_pending':
      return {
        action: 'Check Verification Status',
        description: 'Your identity verification may be complete',
        priority: 'medium'
      }
    
    case 'verification_complete':
      return {
        action: 'Connect Bank Account',
        description: 'Connect your bank account to receive payments',
        priority: 'high'
      }
    
    case 'payment_setup':
      return {
        action: 'Pay Onboarding Fee',
        description: 'Pay £15 to complete setup and start earning',
        priority: 'high'
      }
    
    case 'completed':
      return {
        action: 'Start Taking Bookings',
        description: 'Your setup is complete! Start accepting bookings',
        priority: 'low'
      }
    
    default:
      return {
        action: 'Continue Setup',
        description: 'Complete the remaining onboarding steps',
        priority: 'medium'
      }
  }
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle,
  Shield,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Loader2,
  DollarSign,
} from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { createClient } from '@/utils/supabase/client'
import {
  getOnboardingStatus,
  saveProfileSetup,
  submitEmbeddedKYC,
  processOnboardingPayment,
  confirmOnboardingPayment,
  completeOnboarding,
  type ProfileSetupData,
  type OnboardingStatus,
} from '@/lib/stripe/actions'
import { OnboardingErrorBoundary } from './OnboardingErrorBoundary'
import {
  OnboardingLoadingState,
  LoadingOverlay,
} from './OnboardingLoadingState'
import {
  useOnboardingErrorHandler,
  OnboardingRecovery,
} from '@/lib/onboarding-error-handling'
import {
  OnboardingToasts,
  showErrorToastWithRetry,
  showStepCompletionToast,
} from '@/components/ui/toast-with-action'

type Profile = Tables<'profiles'>

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  status: 'pending' | 'current' | 'completed'
}

// Use the types from the server actions
type OnboardingData = OnboardingStatus
type ProfileData = ProfileSetupData

interface WasherOnboardingFlowProps {
  user: { id: string } | null
  profile: Profile
  onStepComplete: (step: number, data: unknown) => Promise<void>
  onOnboardingComplete: () => Promise<void>
}

export function WasherOnboardingFlow({
  user,
  onStepComplete,
  onOnboardingComplete,
}: WasherOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [data, setData] = useState<OnboardingData>({
    currentStep: 1,
    completedSteps: [],
    isComplete: false,
  })
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Check for recovery state on mount
  useEffect(() => {
    const recoveryState = OnboardingRecovery.getRecoveryState()
    if (recoveryState && recoveryState.userId === user?.id) {
      // Show recovery prompt
      const handleRecover = () => {
        setCurrentStep(recoveryState.step)
        OnboardingRecovery.clearRecoveryState()
        showStepCompletionToast(recoveryState.step, 'Onboarding Resumed')
      }

      const handleDismiss = () => {
        OnboardingRecovery.clearRecoveryState()
      }

      // Show recovery prompt after a short delay
      setTimeout(() => {
        OnboardingRecovery.showRecoveryPrompt(handleRecover, handleDismiss)
      }, 1000)
    }
  }, [user?.id])

  // Load onboarding status on component mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      if (!user?.id) return

      try {
        setHasError(false)
        const result = await getOnboardingStatus(user.id)
        if (result.success && result.data) {
          setData(result.data)
          setCurrentStep(result.data.currentStep)
        } else {
          console.error('Failed to load onboarding status:', result.error)
          setHasError(true)
          setErrorMessage(
            result.error?.message || 'Failed to load onboarding status'
          )
          showErrorToastWithRetry(
            'Loading Error',
            'Failed to load your onboarding status. Please try again.',
            () => window.location.reload(),
            true,
            'Reload Page'
          )
        }
      } catch (error) {
        console.error('Error loading onboarding status:', error)
        setHasError(true)
        setErrorMessage(
          error instanceof Error ? error.message : 'Unknown error occurred'
        )
        showErrorToastWithRetry(
          'Connection Error',
          'Unable to load onboarding status. Please check your connection.',
          () => window.location.reload(),
          true,
          'Retry'
        )
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadOnboardingStatus()
  }, [user?.id])

  // 4-step onboarding flow
  const steps: OnboardingStep[] = [
    {
      id: 'profile-setup',
      title: 'Profile & Service Setup',
      description: 'Complete your profile and service preferences',
      icon: User,
      status: data.completedSteps.includes(1)
        ? 'completed'
        : currentStep === 1
          ? 'current'
          : 'pending',
    },
    {
      id: 'stripe-kyc',
      title: 'Stripe Connect KYC',
      description: 'Verify your identity with ID uploads',
      icon: Shield,
      status: data.completedSteps.includes(2)
        ? 'completed'
        : currentStep === 2
          ? 'current'
          : 'pending',
    },
    {
      id: 'bank-connection',
      title: 'Bank Account Connection',
      description: 'Connect your bank for payouts',
      icon: Building,
      status: data.completedSteps.includes(3)
        ? 'completed'
        : currentStep === 3
          ? 'current'
          : 'pending',
    },
    {
      id: 'payment',
      title: 'Onboarding Fee Payment',
      description: 'Pay £15 onboarding fee to unlock features',
      icon: DollarSign,
      status: data.completedSteps.includes(4)
        ? 'completed'
        : currentStep === 4
          ? 'current'
          : 'pending',
    },
  ]

  const handleStepComplete = async (step: number, stepData: unknown) => {
    if (!user?.id) return

    setIsLoading(true)
    setIsTransitioning(true)
    setHasError(false)

    // Save recovery state in case of interruption
    OnboardingRecovery.saveRecoveryState(user.id, step, stepData)

    try {
      // Show loading toast for the step
      const loadingToast =
        step === 1
          ? OnboardingToasts.profileSetupStart()
          : step === 2
            ? OnboardingToasts.kycStart()
            : step === 3
              ? OnboardingToasts.bankConnectionStart()
              : OnboardingToasts.paymentStart()

      // Handle Step 1: Profile Setup
      if (step === 1) {
        const result = await saveProfileSetup(user.id, stepData as ProfileData)
        if (!result.success) {
          throw new Error(
            result.error?.message || 'Failed to save profile setup'
          )
        }
        OnboardingToasts.profileSetupSuccess()
      }

      // Call the parent handler for other steps
      await onStepComplete(step, stepData)

      // Update local state
      setData((prev) => ({
        ...prev,
        completedSteps: [
          ...prev.completedSteps.filter((s) => s !== step),
          step,
        ], // Avoid duplicates
        currentStep: step < 4 ? step + 1 : step,
        isComplete: step === 4,
        profileData:
          step === 1 ? (stepData as ProfileSetupData) : prev.profileData,
      }))

      // Show step completion toast
      showStepCompletionToast(step, `Step ${step}`)

      if (step < 4) {
        setCurrentStep(step + 1)
      } else {
        // Clear recovery state on completion
        OnboardingRecovery.clearRecoveryState()
        OnboardingToasts.onboardingComplete()
        await onOnboardingComplete()
      }

      // Dismiss loading toast
      loadingToast?.dismiss()
    } catch (error) {
      console.error('Error completing step:', error)
      setHasError(true)
      setErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )

      // Show error toast with retry option
      const retryHandler = () => handleStepComplete(step, stepData)

      if (step === 1) {
        OnboardingToasts.profileSetupError(
          error instanceof Error
            ? error.message
            : 'Failed to save profile setup',
          retryHandler
        )
      } else if (step === 2) {
        OnboardingToasts.kycError(
          error instanceof Error
            ? error.message
            : 'Failed to complete identity verification',
          retryHandler
        )
      } else if (step === 3) {
        OnboardingToasts.bankConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to connect bank account',
          retryHandler
        )
      } else if (step === 4) {
        OnboardingToasts.paymentError(
          error instanceof Error ? error.message : 'Failed to process payment',
          retryHandler
        )
      }

      // Don't proceed to next step on error
    } finally {
      setIsLoading(false)
      setIsTransitioning(false)
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCurrentStep(currentStep - 1)
      setIsTransitioning(false)
    }
  }

  const progress = (data.completedSteps.length / steps.length) * 100

  // Show loading state while fetching onboarding status
  if (isInitialLoading) {
    return (
      <div className='space-y-4'>
        <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-center space-x-2'>
              <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
              <span className='text-sm text-blue-600'>
                Loading onboarding status...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (data.isComplete) {
    return (
      <div className='animate-in fade-in-0 duration-500'>
        <Card className='border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'>
          <CardContent className='p-6'>
            <div className='space-y-4 text-center'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                <CheckCircle className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Onboarding Complete!
                </h3>
                <p className='text-sm text-gray-600'>
                  You now have full access to all washer features
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                className='w-full'
                size='sm'
              >
                Access Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <OnboardingErrorBoundary userId={user?.id} step={currentStep}>
      <div className='space-y-4'>
        {/* Show error state if there's a general error */}
        {hasError && (
          <OnboardingLoadingState
            isLoading={false}
            step={currentStep}
            stepName={steps[currentStep - 1]?.title || 'Current Step'}
            error={errorMessage}
            className='mb-4'
          />
        )}

        {/* Compact Header */}
        <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold text-gray-900'>
                  Complete Your Setup
                </h3>
                <p className='text-sm text-gray-600'>
                  Step {currentStep} of {steps.length}
                </p>
              </div>
              <div className='text-right'>
                <div className='text-sm font-medium text-blue-600'>
                  {Math.round(progress)}% Complete
                </div>
                <Progress value={progress} className='mt-1 h-2 w-24' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4-Step Progress Indicator */}
        <div className='flex justify-center space-x-2'>
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const stepNumber = index + 1
            return (
              <div key={step.id} className='flex items-center'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    step.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step.status === 'current'
                        ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                        : 'bg-gray-200 text-gray-400'
                  } `}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className='h-4 w-4' />
                  ) : (
                    <StepIcon className='h-4 w-4' />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-8 transition-colors duration-300 ${data.completedSteps.includes(stepNumber) ? 'bg-green-500' : 'bg-gray-200'} `}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Current Step Content */}
        <Card className='border-gray-200'>
          <CardContent className='p-6'>
            <LoadingOverlay isLoading={isLoading} message='Processing step...'>
              <div
                className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'translate-x-2 transform opacity-0' : 'translate-x-0 transform opacity-100'} `}
              >
                {currentStep === 1 && (
                  <ProfileSetupStep
                    onNext={(data) => handleStepComplete(1, data)}
                    isLoading={isLoading}
                    initialData={data.profileData}
                    userId={user?.id || ''}
                  />
                )}
                {currentStep === 2 && (
                  <StripeKYCStep
                    onNext={() => handleStepComplete(2, {})}
                    onBack={handleBack}
                    isLoading={isLoading}
                    accountId={data.stripeAccountId}
                    userId={user?.id || ''}
                  />
                )}
                {currentStep === 3 && (
                  <BankConnectionStep
                    onNext={() => handleStepComplete(3, {})}
                    onBack={handleBack}
                    isLoading={isLoading}
                    userId={user?.id || ''}
                  />
                )}
                {currentStep === 4 && (
                  <PaymentStep
                    onComplete={() => handleStepComplete(4, {})}
                    onBack={handleBack}
                    isLoading={isLoading}
                    fee={15}
                    userId={user?.id || ''}
                  />
                )}
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>
      </div>
    </OnboardingErrorBoundary>
  )
}

// Step 1: Profile Setup Component
function ProfileSetupStep({
  onNext,
  isLoading,
  initialData,
  userId,
}: {
  onNext: (data: ProfileData) => void
  isLoading: boolean
  initialData?: ProfileData
  userId: string
}) {
  const [formData, setFormData] = useState<ProfileData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    serviceArea: initialData?.serviceArea || '',
    availability: initialData?.availability || [],
    bio: initialData?.bio || '',
    phoneNumber: initialData?.phoneNumber || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [_hasValidationError, setHasValidationError] = useState(false)

  // Pre-fill name fields from user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const supabase = createClient()
        // Get user profile data to pre-fill first and last name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()

        if (profile?.full_name) {
          const nameParts = profile.full_name.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          setFormData((prev) => ({
            ...prev,
            firstName: prev.firstName || firstName,
            lastName: prev.lastName || lastName,
          }))
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    }

    if (userId && !formData.firstName && !formData.lastName) {
      loadUserProfile()
    }
  }, [userId, formData.firstName, formData.lastName])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.serviceArea.trim()) {
      newErrors.serviceArea = 'Service area is required'
    }
    if (formData.availability.length === 0) {
      newErrors.availability = 'Please select at least one availability slot'
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    // Bio is now optional - no validation needed

    setErrors(newErrors)
    setHasValidationError(Object.keys(newErrors).length > 0)

    if (Object.keys(newErrors).length > 0) {
      showErrorToastWithRetry(
        'Form Validation Error',
        'Please fix the highlighted fields and try again.',
        () => {}, // No retry needed for validation errors
        false
      )
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      onNext(formData)
    }
  }

  // London boroughs for service area dropdown
  const londonBoroughs = [
    'Barking and Dagenham',
    'Barnet',
    'Bexley',
    'Brent',
    'Bromley',
    'Camden',
    'Croydon',
    'Ealing',
    'Enfield',
    'Greenwich',
    'Hackney',
    'Hammersmith and Fulham',
    'Haringey',
    'Harrow',
    'Havering',
    'Hillingdon',
    'Hounslow',
    'Islington',
    'Kensington and Chelsea',
    'Kingston upon Thames',
    'Lambeth',
    'Lewisham',
    'Merton',
    'Newham',
    'Redbridge',
    'Richmond upon Thames',
    'Southwark',
    'Sutton',
    'Tower Hamlets',
    'Waltham Forest',
    'Wandsworth',
    'Westminster',
    'City of London',
  ]

  // Availability options matching booking time slots
  const availabilityOptions = [
    'Monday 9:00 AM - 12:00 PM',
    'Monday 1:00 PM - 4:00 PM',
    'Monday 5:00 PM - 8:00 PM',
    'Tuesday 9:00 AM - 12:00 PM',
    'Tuesday 1:00 PM - 4:00 PM',
    'Tuesday 5:00 PM - 8:00 PM',
    'Wednesday 9:00 AM - 12:00 PM',
    'Wednesday 1:00 PM - 4:00 PM',
    'Wednesday 5:00 PM - 8:00 PM',
    'Thursday 9:00 AM - 12:00 PM',
    'Thursday 1:00 PM - 4:00 PM',
    'Thursday 5:00 PM - 8:00 PM',
    'Friday 9:00 AM - 12:00 PM',
    'Friday 1:00 PM - 4:00 PM',
    'Friday 5:00 PM - 8:00 PM',
    'Saturday 9:00 AM - 12:00 PM',
    'Saturday 1:00 PM - 4:00 PM',
    'Saturday 5:00 PM - 8:00 PM',
    'Sunday 9:00 AM - 12:00 PM',
    'Sunday 1:00 PM - 4:00 PM',
    'Sunday 5:00 PM - 8:00 PM',
  ]

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
          <User className='h-5 w-5 text-blue-600' />
        </div>
        <div>
          <h4 className='font-medium text-gray-900'>Profile & Service Setup</h4>
          <p className='text-sm text-gray-600'>
            Complete your profile and service preferences
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        {/* First Name and Last Name */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='firstName'>First Name *</Label>
            <Input
              id='firstName'
              placeholder='First name'
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className='text-sm text-red-500'>{errors.firstName}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              placeholder='Last name'
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className='text-sm text-red-500'>{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Service Area Dropdown */}
        <div className='space-y-2'>
          <Label htmlFor='serviceArea'>Service Area *</Label>
          <Select
            value={formData.serviceArea}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, serviceArea: value }))
            }
          >
            <SelectTrigger
              className={errors.serviceArea ? 'border-red-500' : ''}
            >
              <SelectValue placeholder='Select your service area' />
            </SelectTrigger>
            <SelectContent>
              {londonBoroughs.map((borough) => (
                <SelectItem key={borough} value={borough}>
                  {borough}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.serviceArea && (
            <p className='text-sm text-red-500'>{errors.serviceArea}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className='space-y-2'>
          <Label htmlFor='phoneNumber'>Phone Number *</Label>
          <Input
            id='phoneNumber'
            placeholder='e.g., +44 7123 456789'
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            className={errors.phoneNumber ? 'border-red-500' : ''}
          />
          {errors.phoneNumber && (
            <p className='text-sm text-red-500'>{errors.phoneNumber}</p>
          )}
        </div>

        {/* Bio */}
        <div className='space-y-2'>
          <Label htmlFor='bio'>About You</Label>
          <Textarea
            id='bio'
            placeholder='Tell customers about your experience and approach to laundry (optional)...'
            value={formData.bio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bio: e.target.value }))
            }
            className={errors.bio ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.bio && <p className='text-sm text-red-500'>{errors.bio}</p>}
        </div>

        {/* Availability - matching booking time slots */}
        <div className='space-y-2'>
          <Label>Availability *</Label>
          <p className='text-xs text-gray-500'>
            Select the time slots when you're available to collect and deliver
            laundry
          </p>
          <div className='grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3'>
            {availabilityOptions.map((option) => (
              <div key={option} className='flex items-center space-x-2'>
                <Checkbox
                  id={option}
                  checked={formData.availability.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        availability: [...prev.availability, option],
                      }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        availability: prev.availability.filter(
                          (a) => a !== option
                        ),
                      }))
                    }
                  }}
                />
                <Label htmlFor={option} className='text-sm'>
                  {option}
                </Label>
              </div>
            ))}
          </div>
          {errors.availability && (
            <p className='text-sm text-red-500'>{errors.availability}</p>
          )}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className='w-full'
        size='sm'
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving Profile...
          </>
        ) : (
          <>
            Complete Profile Setup
            <ArrowRight className='ml-2 h-4 w-4' />
          </>
        )}
      </Button>
    </div>
  )
}

// Step 2: Embedded KYC Component
function StripeKYCStep({
  onNext,
  onBack,
  isLoading,
  accountId,
  userId,
}: {
  onNext: () => void
  onBack: () => void
  isLoading: boolean
  accountId?: string
  userId: string
}) {
  const [kycData, setKycData] = useState({
    dateOfBirth: '',
    address: {
      line1: '',
      city: '',
      postalCode: '',
      country: 'GB',
    },
    idDocument: null as File | null,
    lastFourSSN: '',
  })

  const [kycStatus, setKycStatus] = useState<
    'form' | 'uploading' | 'processing' | 'completed' | 'failed'
  >('form')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Check if KYC is already completed
  useEffect(() => {
    if (accountId) {
      setKycStatus('completed')
    }
  }, [accountId])

  const validateKYCForm = () => {
    const newErrors: Record<string, string> = {}

    // Date of Birth validation
    if (!kycData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(kycData.dateOfBirth)
      const age =
        (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old'
      }
    }

    // Address validation
    if (!kycData.address.line1.trim()) {
      newErrors.addressLine1 = 'Address is required'
    }
    if (!kycData.address.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!kycData.address.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    } else if (
      !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(
        kycData.address.postalCode
      )
    ) {
      newErrors.postalCode = 'Please enter a valid UK postal code'
    }

    // ID Document validation
    if (!kycData.idDocument) {
      newErrors.idDocument = 'ID document is required'
    } else {
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
      ]
      if (!validTypes.includes(kycData.idDocument.type)) {
        newErrors.idDocument = 'Please upload a JPG, PNG, or PDF file'
      }
      if (kycData.idDocument.size > 10 * 1024 * 1024) {
        // 10MB limit
        newErrors.idDocument = 'File size must be less than 10MB'
      }
    }

    // Last 4 digits validation (UK National Insurance number last 4)
    if (!kycData.lastFourSSN.trim()) {
      newErrors.lastFourSSN =
        'Last 4 characters of National Insurance number required'
    } else if (!/^[A-Z0-9]{4}$/i.test(kycData.lastFourSSN)) {
      newErrors.lastFourSSN = 'Please enter 4 characters (letters and numbers)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setKycData((prev) => ({ ...prev, idDocument: file }))
      // Clear any previous file errors
      setErrors((prev) => ({ ...prev, idDocument: '' }))
    }
  }

  const handleKYCSubmit = async () => {
    if (!validateKYCForm()) {
      showErrorToastWithRetry(
        'Form Validation Error',
        'Please fix the highlighted fields and try again.',
        () => {},
        false
      )
      return
    }

    try {
      setKycStatus('uploading')
      setError(null)
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Submit KYC data to our backend
      const result = await submitEmbeddedKYC(userId, kycData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        setKycStatus('processing')

        // Show processing state for a moment
        setTimeout(() => {
          setKycStatus('completed')
          showStepCompletionToast(2, 'Identity Verification')
        }, 2000)
      } else {
        throw new Error(
          result.error?.message || 'Failed to submit verification documents'
        )
      }
    } catch (error) {
      console.error('Error submitting KYC:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to submit verification'
      )
      setKycStatus('failed')
      setUploadProgress(0)

      showErrorToastWithRetry(
        'Verification Error',
        error instanceof Error
          ? error.message
          : 'Failed to submit verification',
        () => handleKYCSubmit(),
        true
      )
    }
  }

  const handleRetry = () => {
    setKycStatus('form')
    setError(null)
    setUploadProgress(0)
  }

  if (kycStatus === 'completed') {
    return (
      <div className='space-y-4'>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900'>
              Identity Verification Complete
            </h4>
            <p className='text-sm text-gray-600'>
              Your identity has been successfully verified
            </p>
          </div>
        </div>

        <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-green-900'>
                Verification Successful
              </p>
              <p className='text-xs text-green-700'>
                Your documents have been verified and your account is ready for
                the next step.
              </p>
            </div>
          </div>
        </div>

        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={onBack}
            size='sm'
            className='flex-1'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Button onClick={onNext} size='sm' className='flex-1'>
            Continue to Bank Connection
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  if (kycStatus === 'processing') {
    return (
      <div className='space-y-4'>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900'>
              Processing Verification
            </h4>
            <p className='text-sm text-gray-600'>
              We're verifying your documents...
            </p>
          </div>
        </div>

        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-start space-x-3'>
            <Loader2 className='mt-0.5 h-5 w-5 animate-spin text-blue-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-blue-900'>
                Verifying Your Identity
              </p>
              <p className='text-xs text-blue-700'>
                This usually takes just a few seconds. Please don't close this
                page.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'uploading') {
    return (
      <div className='space-y-4'>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900'>Uploading Documents</h4>
            <p className='text-sm text-gray-600'>
              Securely uploading your verification documents
            </p>
          </div>
        </div>

        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-blue-900'>
                Upload Progress
              </span>
              <span className='text-sm text-blue-700'>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className='h-2' />
            <p className='text-xs text-blue-700'>
              Please don't close this page while we upload your documents
              securely.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'failed') {
    return (
      <div className='space-y-4'>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-5 w-5 text-red-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900'>Verification Failed</h4>
            <p className='text-sm text-gray-600'>
              There was an issue with your verification
            </p>
          </div>
        </div>

        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 text-red-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-red-900'>
                Verification Error
              </p>
              <p className='text-xs text-red-700'>
                {error ||
                  'There was an issue processing your verification. Please try again.'}
              </p>
            </div>
          </div>
        </div>

        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={onBack}
            size='sm'
            className='flex-1'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Button onClick={handleRetry} size='sm' className='flex-1'>
            <Shield className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Main KYC Form
  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
          <Shield className='h-5 w-5 text-blue-600' />
        </div>
        <div>
          <h4 className='font-medium text-gray-900'>Identity Verification</h4>
          <p className='text-sm text-gray-600'>
            Verify your identity to start receiving payments
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        {/* Date of Birth */}
        <div className='space-y-2'>
          <Label htmlFor='dateOfBirth'>Date of Birth *</Label>
          <Input
            id='dateOfBirth'
            type='date'
            value={kycData.dateOfBirth}
            onChange={(e) =>
              setKycData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
            className={errors.dateOfBirth ? 'border-red-500' : ''}
            max={
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString()
                .split('T')[0]
            }
          />
          {errors.dateOfBirth && (
            <p className='text-sm text-red-500'>{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Address */}
        <div className='space-y-4'>
          <Label className='text-base font-medium'>Address *</Label>

          <div className='space-y-2'>
            <Label htmlFor='addressLine1'>Street Address</Label>
            <Input
              id='addressLine1'
              placeholder='123 Main Street'
              value={kycData.address.line1}
              onChange={(e) =>
                setKycData((prev) => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value },
                }))
              }
              className={errors.addressLine1 ? 'border-red-500' : ''}
            />
            {errors.addressLine1 && (
              <p className='text-sm text-red-500'>{errors.addressLine1}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='city'>City</Label>
              <Input
                id='city'
                placeholder='London'
                value={kycData.address.city}
                onChange={(e) =>
                  setKycData((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className='text-sm text-red-500'>{errors.city}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='postalCode'>Postal Code</Label>
              <Input
                id='postalCode'
                placeholder='SW1A 1AA'
                value={kycData.address.postalCode}
                onChange={(e) =>
                  setKycData((prev) => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      postalCode: e.target.value.toUpperCase(),
                    },
                  }))
                }
                className={errors.postalCode ? 'border-red-500' : ''}
              />
              {errors.postalCode && (
                <p className='text-sm text-red-500'>{errors.postalCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* ID Document Upload */}
        <div className='space-y-2'>
          <Label htmlFor='idDocument'>Government ID Document *</Label>
          <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center'>
            <input
              id='idDocument'
              type='file'
              accept='image/*,.pdf'
              onChange={handleFileUpload}
              className='hidden'
            />
            <Label htmlFor='idDocument' className='cursor-pointer'>
              <div className='space-y-2'>
                <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                  <Shield className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {kycData.idDocument
                      ? kycData.idDocument.name
                      : 'Upload ID Document'}
                  </p>
                  <p className='text-xs text-gray-500'>
                    Passport, Driving License, or National ID (JPG, PNG, PDF)
                  </p>
                </div>
              </div>
            </Label>
          </div>
          {errors.idDocument && (
            <p className='text-sm text-red-500'>{errors.idDocument}</p>
          )}
        </div>

        {/* Last 4 of National Insurance */}
        <div className='space-y-2'>
          <Label htmlFor='lastFourSSN'>
            Last 4 Characters of National Insurance Number *
          </Label>
          <Input
            id='lastFourSSN'
            placeholder='e.g., 23A'
            value={kycData.lastFourSSN}
            onChange={(e) =>
              setKycData((prev) => ({
                ...prev,
                lastFourSSN: e.target.value.toUpperCase(),
              }))
            }
            className={errors.lastFourSSN ? 'border-red-500' : ''}
            maxLength={4}
          />
          {errors.lastFourSSN && (
            <p className='text-sm text-red-500'>{errors.lastFourSSN}</p>
          )}
          <p className='text-xs text-gray-500'>
            We only need the last 4 characters for verification purposes
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
        <div className='flex items-start space-x-3'>
          <Shield className='mt-0.5 h-5 w-5 text-blue-600' />
          <div className='space-y-1'>
            <p className='text-sm font-medium text-blue-900'>
              Your Information is Secure
            </p>
            <p className='text-xs text-blue-700'>
              All data is encrypted and processed securely through Stripe's
              bank-level security infrastructure. We never store your ID
              documents on our servers.
            </p>
          </div>
        </div>
      </div>

      <div className='flex space-x-2'>
        <Button variant='outline' onClick={onBack} size='sm' className='flex-1'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <Button
          onClick={handleKYCSubmit}
          disabled={isLoading}
          size='sm'
          className='flex-1'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Verifying...
            </>
          ) : (
            <>
              <Shield className='mr-2 h-4 w-4' />
              Verify Identity
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Step 3: Bank Connection Component
function BankConnectionStep({
  onNext,
  onBack,
  isLoading,
  userId,
}: {
  onNext: () => void
  onBack: () => void
  isLoading: boolean
  userId: string
}) {
  const [bankStatus, setBankStatus] = useState<
    'not_started' | 'in_progress' | 'completed' | 'failed'
  >('not_started')
  const [error, setError] = useState<string | null>(null)
  const [_retryCount, setRetryCount] = useState(0)
  const { executeWithRetry, handleError } = useOnboardingErrorHandler(userId, 3)

  const handleConnectBank = async () => {
    try {
      setError(null)
      setBankStatus('in_progress')

      // Use enhanced error handling with retry
      await executeWithRetry(
        async () => {
          // Import the bank connection function
          const { initiateBankConnection } = await import(
            '@/lib/stripe/actions'
          )
          const result = await initiateBankConnection(userId)

          if (result.success && result.data) {
            // Save recovery state before redirect
            OnboardingRecovery.saveRecoveryState(userId, 3, {
              bankConnectionUrl: result.data.bankConnectionUrl,
            })

            // Redirect to Stripe bank connection
            window.location.href = result.data.bankConnectionUrl
          } else {
            throw new Error(
              result.error?.message || 'Failed to initiate bank connection'
            )
          }
        },
        {
          maxAttempts: 2, // Fewer retries for external redirects
          baseDelay: 2000,
        }
      )
    } catch (error) {
      console.error('Error connecting bank:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to connect bank account'
      )
      setBankStatus('failed')
      setRetryCount((prev) => prev + 1)

      // Handle error with toast notification
      await handleError(error)
    }
  }

  const handleRetryBank = () => {
    setBankStatus('not_started')
    setError(null)
  }

  const handleBankComplete = useCallback(() => {
    setBankStatus('completed')
    onNext()
  }, [onNext])

  // Listen for callback from Stripe bank connection completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'stripe_bank_complete') {
        handleBankComplete()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleBankComplete])

  // Check URL parameters for bank connection completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('bank_connection') === 'complete') {
      handleBankComplete()
    }
  }, [handleBankComplete])

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
          <Building className='h-5 w-5 text-purple-600' />
        </div>
        <div>
          <h4 className='font-medium text-gray-900'>Bank Account Connection</h4>
          <p className='text-sm text-gray-600'>
            Connect your bank account for payouts
          </p>
        </div>
      </div>

      {bankStatus === 'completed' ? (
        <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-green-900'>
                Bank Account Connected
              </p>
              <p className='text-xs text-green-700'>
                Your bank account has been successfully connected. You can now
                receive payouts directly to your account.
              </p>
            </div>
          </div>
        </div>
      ) : bankStatus === 'failed' ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 text-red-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-red-900'>
                Bank Connection Failed
              </p>
              <p className='text-xs text-red-700'>
                {error ||
                  'There was an issue connecting your bank account. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      ) : bankStatus === 'in_progress' ? (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-start space-x-3'>
            <Loader2 className='mt-0.5 h-5 w-5 animate-spin text-blue-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-blue-900'>
                Redirecting to Stripe...
              </p>
              <p className='text-xs text-blue-700'>
                You'll be redirected to Stripe's secure platform to connect your
                bank account.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
          <div className='flex items-start space-x-3'>
            <Building className='mt-0.5 h-5 w-5 text-purple-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-purple-900'>
                Secure Bank Account Connection
              </p>
              <p className='text-xs text-purple-700'>
                Connect your UK bank account to receive payments. Your banking
                details are securely handled by Stripe.
              </p>
              <div className='space-y-1'>
                <div className='flex items-center space-x-2 text-xs text-purple-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Instant verification</span>
                </div>
                <div className='flex items-center space-x-2 text-xs text-purple-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Secure connection</span>
                </div>
                <div className='flex items-center space-x-2 text-xs text-purple-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Fast payouts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='flex space-x-2'>
        <Button variant='outline' onClick={onBack} size='sm' className='flex-1'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>

        {bankStatus === 'completed' ? (
          <Button onClick={handleBankComplete} size='sm' className='flex-1'>
            Continue to Payment
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        ) : bankStatus === 'failed' ? (
          <Button onClick={handleRetryBank} size='sm' className='flex-1'>
            <Building className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        ) : (
          <Button
            onClick={handleConnectBank}
            disabled={isLoading || bankStatus === 'in_progress'}
            size='sm'
            className='flex-1'
          >
            {isLoading || bankStatus === 'in_progress' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                Connect Bank Account
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// Step 4: Payment Component
function PaymentStep({
  onComplete,
  onBack,
  isLoading,
  fee,
  userId,
}: {
  onComplete: () => void
  onBack: () => void
  isLoading: boolean
  fee: number
  userId: string
}) {
  const [paymentStatus, setPaymentStatus] = useState<
    'not_started' | 'processing' | 'completed' | 'failed'
  >('not_started')
  const [error, setError] = useState<string | null>(null)
  const [_clientSecret, setClientSecret] = useState<string | null>(null)
  const [_paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [_retryCount, setRetryCount] = useState(0)
  const { executeWithRetry, handleError } = useOnboardingErrorHandler(userId, 4)

  const handleStartPayment = async () => {
    if (!userId) {
      setError('User not authenticated. Please refresh and try again.')
      return
    }

    try {
      setError(null)
      setPaymentStatus('processing')

      // Use enhanced error handling with retry
      await executeWithRetry(
        async () => {
          // Create payment intent
          const result = await processOnboardingPayment(userId)

          if (result.success && result.data) {
            setClientSecret(result.data.clientSecret)
            setPaymentIntentId(result.data.paymentIntentId)

            // For now, we'll simulate the payment process
            // In a real implementation, you'd integrate with Stripe Elements here
            await simulatePaymentProcess(
              result.data.clientSecret,
              result.data.paymentIntentId
            )
          } else {
            throw new Error(result.error?.message || 'Failed to create payment')
          }
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }
      )
    } catch (error) {
      console.error('Error starting payment:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to process payment'
      )
      setPaymentStatus('failed')
      setRetryCount((prev) => prev + 1)

      // Handle error with toast notification
      await handleError(error)
    }
  }

  const simulatePaymentProcess = async (
    _clientSecret: string,
    paymentIntentId: string
  ) => {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      // In a real implementation, this would be handled by Stripe Elements
      // For now, we'll directly confirm the payment
      const confirmResult = await confirmOnboardingPayment(
        userId,
        paymentIntentId
      )

      if (confirmResult.success) {
        setPaymentStatus('completed')
        // Complete the onboarding process
        const completeResult = await completeOnboarding(userId)
        if (completeResult.success) {
          onComplete()
        } else {
          throw new Error(
            'Payment successful but failed to complete onboarding'
          )
        }
      } else {
        throw new Error(
          confirmResult.error?.message || 'Payment confirmation failed'
        )
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      setError(
        error instanceof Error ? error.message : 'Payment confirmation failed'
      )
      setPaymentStatus('failed')
    }
  }

  const handleRetryPayment = () => {
    setPaymentStatus('not_started')
    setError(null)
    setClientSecret(null)
    setPaymentIntentId(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
          <DollarSign className='h-5 w-5 text-orange-600' />
        </div>
        <div>
          <h4 className='font-medium text-gray-900'>Onboarding Fee Payment</h4>
          <p className='text-sm text-gray-600'>
            Pay £{fee} onboarding fee to unlock features
          </p>
        </div>
      </div>

      {paymentStatus === 'completed' ? (
        <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-green-900'>
                Payment Successful!
              </p>
              <p className='text-xs text-green-700'>
                Your onboarding fee has been processed successfully. All washer
                features are now unlocked.
              </p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 text-red-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-red-900'>Payment Failed</p>
              <p className='text-xs text-red-700'>
                {error ||
                  'There was an issue processing your payment. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'processing' ? (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-start space-x-3'>
            <Loader2 className='mt-0.5 h-5 w-5 animate-spin text-blue-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-blue-900'>
                Processing Payment...
              </p>
              <p className='text-xs text-blue-700'>
                Please wait while we process your payment. This may take a few
                moments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
          <div className='flex items-start space-x-3'>
            <DollarSign className='mt-0.5 h-5 w-5 text-orange-600' />
            <div className='space-y-2'>
              <p className='text-sm font-medium text-orange-900'>
                One-time Onboarding Fee: £{fee}
              </p>
              <p className='text-xs text-orange-700'>
                This one-time fee covers platform setup, verification
                processing, and gives you full access to all washer features.
              </p>
              <div className='space-y-1'>
                <div className='flex items-center space-x-2 text-xs text-orange-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Access to all bookings</span>
                </div>
                <div className='flex items-center space-x-2 text-xs text-orange-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Payout functionality</span>
                </div>
                <div className='flex items-center space-x-2 text-xs text-orange-600'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Full dashboard access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='rounded-lg bg-gray-50 p-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-gray-900'>
            Total Amount:
          </span>
          <span className='text-lg font-bold text-gray-900'>£{fee}</span>
        </div>
      </div>

      <div className='flex space-x-2'>
        <Button variant='outline' onClick={onBack} size='sm' className='flex-1'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>

        {paymentStatus === 'completed' ? (
          <Button onClick={onComplete} size='sm' className='flex-1'>
            Complete Setup
            <CheckCircle className='ml-2 h-4 w-4' />
          </Button>
        ) : paymentStatus === 'failed' ? (
          <Button onClick={handleRetryPayment} size='sm' className='flex-1'>
            <DollarSign className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        ) : (
          <Button
            onClick={handleStartPayment}
            disabled={isLoading || paymentStatus === 'processing' || !userId}
            size='sm'
            className='flex-1'
          >
            {isLoading || paymentStatus === 'processing' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing Payment...
              </>
            ) : (
              <>
                Pay £{fee} & Complete Setup
                <CheckCircle className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

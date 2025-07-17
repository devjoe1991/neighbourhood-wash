'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckCircle, 
  Shield, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Loader2,
  DollarSign
} from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { getOnboardingStatus, saveProfileSetup, initiateStripeKYC, processOnboardingPayment, confirmOnboardingPayment, completeOnboarding, type ProfileSetupData, type OnboardingStatus } from '@/lib/stripe/actions'

type Profile = Tables<'profiles'>

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  status: 'pending' | 'current' | 'completed'
}

// Use the types from the server actions
type OnboardingData = OnboardingStatus
type ProfileData = ProfileSetupData

interface WasherOnboardingFlowProps {
  user: unknown
  profile: Profile
  onStepComplete: (step: number, data: unknown) => Promise<void>
  onOnboardingComplete: () => Promise<void>
}

export function WasherOnboardingFlow({ 
  user, 
  onStepComplete, 
  onOnboardingComplete 
}: WasherOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [data, setData] = useState<OnboardingData>({
    currentStep: 1,
    completedSteps: [],
    isComplete: false
  })

  // Load onboarding status on component mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      if (!user?.id) return

      try {
        const result = await getOnboardingStatus(user.id)
        if (result.success && result.data) {
          setData(result.data)
          setCurrentStep(result.data.currentStep)
        } else {
          console.error('Failed to load onboarding status:', result.error)
        }
      } catch (error) {
        console.error('Error loading onboarding status:', error)
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
      status: data.completedSteps.includes(1) ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 'stripe-kyc',
      title: 'Stripe Connect KYC',
      description: 'Verify your identity with ID uploads',
      icon: Shield,
      status: data.completedSteps.includes(2) ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    },
    {
      id: 'bank-connection',
      title: 'Bank Account Connection',
      description: 'Connect your bank for payouts',
      icon: Building,
      status: data.completedSteps.includes(3) ? 'completed' : currentStep === 3 ? 'current' : 'pending'
    },
    {
      id: 'payment',
      title: 'Onboarding Fee Payment',
      description: 'Pay £15 onboarding fee to unlock features',
      icon: DollarSign,
      status: data.completedSteps.includes(4) ? 'completed' : currentStep === 4 ? 'current' : 'pending'
    }
  ]

  const handleStepComplete = async (step: number, stepData: unknown) => {
    setIsLoading(true)
    setIsTransitioning(true)
    
    try {
      // Handle Step 1: Profile Setup
      if (step === 1 && user?.id) {
        const result = await saveProfileSetup(user.id, stepData as ProfileData)
        if (!result.success) {
          console.error('Failed to save profile setup:', result.error)
          throw new Error(result.error?.message || 'Failed to save profile setup')
        }
      }

      // Call the parent handler for other steps
      await onStepComplete(step, stepData)
      
      // Update local state
      setData(prev => ({
        ...prev,
        completedSteps: [...prev.completedSteps.filter(s => s !== step), step], // Avoid duplicates
        currentStep: step < 4 ? step + 1 : step,
        isComplete: step === 4,
        profileData: step === 1 ? stepData : prev.profileData
      }))
      
      if (step < 4) {
        setCurrentStep(step + 1)
      } else {
        await onOnboardingComplete()
      }
    } catch (error) {
      console.error('Error completing step:', error)
      // Handle error - could show toast notification
      // For now, we'll just log it and not proceed to next step
    } finally {
      setIsLoading(false)
      setIsTransitioning(false)
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setCurrentStep(currentStep - 1)
      setIsTransitioning(false)
    }
  }

  const progress = (data.completedSteps.length / steps.length) * 100

  // Show loading state while fetching onboarding status
  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Loading onboarding status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (data.isComplete) {
    return (
      <div className="animate-in fade-in-0 duration-500">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Onboarding Complete!</h3>
                <p className="text-sm text-gray-600">You now have full access to all washer features</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                size="sm"
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
    <div className="space-y-4">
      {/* Compact Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Complete Your Setup</h3>
              <p className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">
                {Math.round(progress)}% Complete
              </div>
              <Progress value={progress} className="w-24 h-2 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4-Step Progress Indicator */}
      <div className="flex justify-center space-x-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const stepNumber = index + 1
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${step.status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : step.status === 'current'
                  ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                  : 'bg-gray-200 text-gray-400'
                }
              `}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-8 h-0.5 mx-1 transition-colors duration-300
                  ${data.completedSteps.includes(stepNumber) ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          )
        })}
      </div>

      {/* Current Step Content */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'}
          `}>
            {currentStep === 1 && (
              <ProfileSetupStep 
                onNext={(data) => handleStepComplete(1, data)}
                isLoading={isLoading}
                initialData={data.profileData}
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
        </CardContent>
      </Card>
    </div>
  )
}

// Step 1: Profile Setup Component
function ProfileSetupStep({ 
  onNext, 
  isLoading, 
  initialData 
}: { 
  onNext: (data: ProfileData) => void
  isLoading: boolean
  initialData?: ProfileData 
}) {
  const [formData, setFormData] = useState<ProfileData>({
    serviceArea: initialData?.serviceArea || '',
    availability: initialData?.availability || [],
    serviceTypes: initialData?.serviceTypes || [],
    preferences: initialData?.preferences || '',
    bio: initialData?.bio || '',
    phoneNumber: initialData?.phoneNumber || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
    }
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required'
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
    'Wednesday Morning', 'Wednesday Afternoon', 'Wednesday Evening',
    'Thursday Morning', 'Thursday Afternoon', 'Thursday Evening',
    'Friday Morning', 'Friday Afternoon', 'Friday Evening',
    'Saturday Morning', 'Saturday Afternoon', 'Saturday Evening',
    'Sunday Morning', 'Sunday Afternoon', 'Sunday Evening'
  ]

  const serviceTypeOptions = [
    'Wash & Dry', 'Wash Only', 'Dry Only', 'Ironing', 'Folding', 'Collection & Delivery'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Profile & Service Setup</h4>
          <p className="text-sm text-gray-600">Complete your profile and service preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Service Area */}
        <div className="space-y-2">
          <Label htmlFor="serviceArea">Service Area *</Label>
          <Input
            id="serviceArea"
            placeholder="e.g., Central London, Manchester City Centre"
            value={formData.serviceArea}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
            className={errors.serviceArea ? 'border-red-500' : ''}
          />
          {errors.serviceArea && <p className="text-sm text-red-500">{errors.serviceArea}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            placeholder="e.g., +44 7123 456789"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            className={errors.phoneNumber ? 'border-red-500' : ''}
          />
          {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">About You *</Label>
          <Textarea
            id="bio"
            placeholder="Tell customers about your experience and approach to laundry..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className={errors.bio ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.bio && <p className="text-sm text-red-500">{errors.bio}</p>}
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <Label>Availability *</Label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {availabilityOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={formData.availability.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
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
                />
                <Label htmlFor={option} className="text-xs">{option}</Label>
              </div>
            ))}
          </div>
          {errors.availability && <p className="text-sm text-red-500">{errors.availability}</p>}
        </div>

        {/* Service Types */}
        <div className="space-y-2">
          <Label>Service Types *</Label>
          <div className="grid grid-cols-2 gap-2">
            {serviceTypeOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={formData.serviceTypes.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
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
                />
                <Label htmlFor={option} className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
          {errors.serviceTypes && <p className="text-sm text-red-500">{errors.serviceTypes}</p>}
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <Label htmlFor="preferences">Additional Preferences</Label>
          <Textarea
            id="preferences"
            placeholder="Any special preferences or notes about your service..."
            value={formData.preferences}
            onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
            rows={2}
          />
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={isLoading}
        className="w-full" 
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            Complete Profile Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}

// Step 2: Stripe KYC Component
function StripeKYCStep({ 
  onNext, 
  onBack, 
  isLoading, 
  accountId,
  userId 
}: { 
  onNext: () => void
  onBack: () => void
  isLoading: boolean
  accountId?: string
  userId: string
}) {
  const [kycStatus, setKycStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'failed'>('not_started')
  const [error, setError] = useState<string | null>(null)

  // Check if KYC is already completed
  useEffect(() => {
    if (accountId) {
      // If we have an account ID, check its status
      setKycStatus('completed')
    }
  }, [accountId])

  const handleStartKYC = async () => {
    try {
      setError(null)
      setKycStatus('in_progress')

      // Use the new initiateStripeKYC function
      const result = await initiateStripeKYC(userId)
      
      if (result.success && result.data) {
        // Redirect to Stripe KYC
        window.location.href = result.data.onboardingUrl
      } else {
        throw new Error(result.error?.message || 'Failed to initiate KYC verification')
      }
    } catch (error) {
      console.error('Error starting KYC:', error)
      setError(error instanceof Error ? error.message : 'Failed to start KYC verification')
      setKycStatus('failed')
    }
  }

  const handleRetryKYC = () => {
    setKycStatus('not_started')
    setError(null)
  }

  const handleKYCComplete = () => {
    setKycStatus('completed')
    onNext()
  }

  // Listen for callback from Stripe KYC completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data?.type === 'stripe_kyc_complete') {
        handleKYCComplete()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Stripe Connect KYC</h4>
          <p className="text-sm text-gray-600">Verify your identity with ID uploads</p>
        </div>
      </div>

      {kycStatus === 'completed' ? (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-900">
                KYC Verification Complete
              </p>
              <p className="text-xs text-green-700">
                Your identity has been successfully verified with Stripe. You can now proceed to the next step.
              </p>
            </div>
          </div>
        </div>
      ) : kycStatus === 'failed' ? (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900">
                KYC Verification Failed
              </p>
              <p className="text-xs text-red-700">
                {error || 'There was an issue starting the verification process. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      ) : kycStatus === 'in_progress' ? (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Redirecting to Stripe...
              </p>
              <p className="text-xs text-blue-700">
                You'll be redirected to Stripe's secure platform to complete your identity verification.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Secure Identity Verification
              </p>
              <p className="text-xs text-blue-700">
                We use Stripe's secure platform to verify your identity. You'll need to upload a government-issued ID and complete verification steps.
              </p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>ID document upload</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Personal information verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button variant="outline" onClick={onBack} size="sm" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {kycStatus === 'completed' ? (
          <Button 
            onClick={handleKYCComplete} 
            size="sm" 
            className="flex-1"
          >
            Continue to Bank Connection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : kycStatus === 'failed' ? (
          <Button 
            onClick={handleRetryKYC} 
            size="sm" 
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : (
          <Button 
            onClick={handleStartKYC} 
            disabled={isLoading || kycStatus === 'in_progress'}
            size="sm" 
            className="flex-1"
          >
            {isLoading || kycStatus === 'in_progress' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting KYC...
              </>
            ) : (
              <>
                Start KYC Verification
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// Step 3: Bank Connection Component
function BankConnectionStep({ 
  onNext, 
  onBack, 
  isLoading,
  userId 
}: { 
  onNext: () => void
  onBack: () => void
  isLoading: boolean
  userId: string
}) {
  const [bankStatus, setBankStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'failed'>('not_started')
  const [error, setError] = useState<string | null>(null)

  const handleConnectBank = async () => {
    try {
      setError(null)
      setBankStatus('in_progress')

      // Import the bank connection function
      const { initiateBankConnection } = await import('@/lib/stripe/actions')
      const result = await initiateBankConnection(userId)
      
      if (result.success && result.data) {
        // Redirect to Stripe bank connection
        window.location.href = result.data.bankConnectionUrl
      } else {
        throw new Error(result.error?.message || 'Failed to initiate bank connection')
      }
    } catch (error) {
      console.error('Error connecting bank:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect bank account')
      setBankStatus('failed')
    }
  }

  const handleRetryBank = () => {
    setBankStatus('not_started')
    setError(null)
  }

  const handleBankComplete = () => {
    setBankStatus('completed')
    onNext()
  }

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
  }, [])

  // Check URL parameters for bank connection completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('bank_connection') === 'complete') {
      handleBankComplete()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Building className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Bank Account Connection</h4>
          <p className="text-sm text-gray-600">Connect your bank account for payouts</p>
        </div>
      </div>

      {bankStatus === 'completed' ? (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-900">
                Bank Account Connected
              </p>
              <p className="text-xs text-green-700">
                Your bank account has been successfully connected. You can now receive payouts directly to your account.
              </p>
            </div>
          </div>
        </div>
      ) : bankStatus === 'failed' ? (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900">
                Bank Connection Failed
              </p>
              <p className="text-xs text-red-700">
                {error || 'There was an issue connecting your bank account. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      ) : bankStatus === 'in_progress' ? (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Redirecting to Stripe...
              </p>
              <p className="text-xs text-blue-700">
                You'll be redirected to Stripe's secure platform to connect your bank account.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start space-x-3">
            <Building className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-900">
                Secure Bank Account Connection
              </p>
              <p className="text-xs text-purple-700">
                Connect your UK bank account to receive payments. Your banking details are securely handled by Stripe.
              </p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs text-purple-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Instant verification</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-purple-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Secure connection</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-purple-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Fast payouts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button variant="outline" onClick={onBack} size="sm" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {bankStatus === 'completed' ? (
          <Button 
            onClick={handleBankComplete} 
            size="sm" 
            className="flex-1"
          >
            Continue to Payment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : bankStatus === 'failed' ? (
          <Button 
            onClick={handleRetryBank} 
            size="sm" 
            className="flex-1"
          >
            <Building className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : (
          <Button 
            onClick={handleConnectBank} 
            disabled={isLoading || bankStatus === 'in_progress'}
            size="sm" 
            className="flex-1"
          >
            {isLoading || bankStatus === 'in_progress' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect Bank Account
                <ArrowRight className="w-4 h-4 ml-2" />
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
  userId 
}: { 
  onComplete: () => void
  onBack: () => void
  isLoading: boolean
  fee: number
  userId: string 
}) {
  const [paymentStatus, setPaymentStatus] = useState<'not_started' | 'processing' | 'completed' | 'failed'>('not_started')
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  const handleStartPayment = async () => {
    if (!userId) {
      setError('User not authenticated. Please refresh and try again.')
      return
    }

    try {
      setError(null)
      setPaymentStatus('processing')

      // Create payment intent
      const result = await processOnboardingPayment(userId)
      
      if (result.success && result.data) {
        setClientSecret(result.data.clientSecret)
        setPaymentIntentId(result.data.paymentIntentId)
        
        // For now, we'll simulate the payment process
        // In a real implementation, you'd integrate with Stripe Elements here
        await simulatePaymentProcess(result.data.clientSecret, result.data.paymentIntentId)
      } else {
        throw new Error(result.error?.message || 'Failed to create payment')
      }
    } catch (error) {
      console.error('Error starting payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to process payment')
      setPaymentStatus('failed')
    }
  }

  const simulatePaymentProcess = async (clientSecret: string, paymentIntentId: string) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      // In a real implementation, this would be handled by Stripe Elements
      // For now, we'll directly confirm the payment
      const confirmResult = await confirmOnboardingPayment(userId, paymentIntentId)
      
      if (confirmResult.success) {
        setPaymentStatus('completed')
        // Complete the onboarding process
        const completeResult = await completeOnboarding(userId)
        if (completeResult.success) {
          onComplete()
        } else {
          throw new Error('Payment successful but failed to complete onboarding')
        }
      } else {
        throw new Error(confirmResult.error?.message || 'Payment confirmation failed')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      setError(error instanceof Error ? error.message : 'Payment confirmation failed')
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
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Onboarding Fee Payment</h4>
          <p className="text-sm text-gray-600">Pay £{fee} onboarding fee to unlock features</p>
        </div>
      </div>

      {paymentStatus === 'completed' ? (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-900">
                Payment Successful!
              </p>
              <p className="text-xs text-green-700">
                Your onboarding fee has been processed successfully. All washer features are now unlocked.
              </p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900">
                Payment Failed
              </p>
              <p className="text-xs text-red-700">
                {error || 'There was an issue processing your payment. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'processing' ? (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Processing Payment...
              </p>
              <p className="text-xs text-blue-700">
                Please wait while we process your payment. This may take a few moments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-900">
                One-time Onboarding Fee: £{fee}
              </p>
              <p className="text-xs text-orange-700">
                This one-time fee covers platform setup, verification processing, and gives you full access to all washer features.
              </p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs text-orange-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Access to all bookings</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-orange-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Payout functionality</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-orange-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Full dashboard access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">£{fee}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={onBack} size="sm" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {paymentStatus === 'completed' ? (
          <Button 
            onClick={onComplete} 
            size="sm" 
            className="flex-1"
          >
            Complete Setup
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        ) : paymentStatus === 'failed' ? (
          <Button 
            onClick={handleRetryPayment} 
            size="sm" 
            className="flex-1"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : (
          <Button 
            onClick={handleStartPayment} 
            disabled={isLoading || paymentStatus === 'processing' || !userId}
            size="sm" 
            className="flex-1"
          >
            {isLoading || paymentStatus === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                Pay £{fee} & Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
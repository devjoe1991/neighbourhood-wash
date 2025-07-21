'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  User,
  Shield,
  Building,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { 
  OnboardingState, 
  OnboardingStatus,
  getOnboardingStatus,
  startWasherOnboarding,
} from '@/lib/onboarding/onboarding-service'
import {
  trackStepStarted,
  trackStepCompleted,
  trackStepFailed,
} from '@/lib/onboarding/onboarding-progress-tracker'
import { ProfileSetupStep } from './ProfileSetupStep'
import { StripeVerificationStep } from './StripeVerificationStep'
import { BankConnectionStep } from './BankConnectionStep'
import { PaymentSetupStep } from './PaymentSetupStep'
import { OnboardingErrorBoundary } from './OnboardingErrorBoundary'
import { OnboardingLoadingState } from './OnboardingLoadingState'

interface OnboardingStateMachineProps {
  userId: string
  userEmail?: string
}

interface StepConfig {
  id: OnboardingStatus
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  component: React.ComponentType<any>
}

const STEP_CONFIGS: StepConfig[] = [
  {
    id: 'profile_setup',
    title: 'Profile Setup',
    description: 'Complete your profile and service preferences',
    icon: User,
    component: ProfileSetupStep,
  },
  {
    id: 'verification_pending',
    title: 'Identity Verification',
    description: 'Verify your identity with Stripe Connect',
    icon: Shield,
    component: StripeVerificationStep,
  },
  {
    id: 'verification_complete',
    title: 'Bank Connection',
    description: 'Connect your bank account for payouts',
    icon: Building,
    component: BankConnectionStep,
  },
  {
    id: 'payment_setup',
    title: 'Onboarding Fee',
    description: 'Pay £15 onboarding fee to complete setup',
    icon: CreditCard,
    component: PaymentSetupStep,
  },
]

export function OnboardingStateMachine({ userId, userEmail }: OnboardingStateMachineProps) {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load onboarding status
  const loadOnboardingStatus = useCallback(async () => {
    try {
      setError(null)
      const result = await getOnboardingStatus(userId)
      
      if (result.success && result.data) {
        setOnboardingState(result.data)
        
        // If user hasn't started onboarding, start it automatically
        if (result.data.currentStep === 'not_started') {
          const startResult = await startWasherOnboarding(userId)
          if (startResult.success && startResult.data) {
            setOnboardingState(startResult.data)
            await trackStepStarted(userId, 'profile_setup')
          }
        }
      } else {
        setError(result.error?.message || 'Failed to load onboarding status')
      }
    } catch (err) {
      console.error('Error loading onboarding status:', err)
      setError('Failed to load onboarding status')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadOnboardingStatus()
  }, [loadOnboardingStatus])

  // Handle step completion
  const handleStepComplete = async (step: OnboardingStatus, data?: any) => {
    try {
      setIsTransitioning(true)
      setError(null)

      await trackStepCompleted(userId, step, data)
      
      // Reload onboarding status to get updated state
      await loadOnboardingStatus()
      
    } catch (err) {
      console.error('Error completing step:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete step'
      setError(errorMessage)
      await trackStepFailed(userId, step, errorMessage, data)
    } finally {
      setIsTransitioning(false)
    }
  }

  // Handle step failure
  const handleStepError = async (step: OnboardingStatus, error: string, data?: any) => {
    setError(error)
    await trackStepFailed(userId, step, error, data)
  }

  // Get step status for display
  const getStepStatus = (stepId: OnboardingStatus): 'pending' | 'current' | 'completed' => {
    if (!onboardingState) return 'pending'
    
    if (onboardingState.completedSteps.includes(stepId)) {
      return 'completed'
    }
    
    if (onboardingState.currentStep === stepId) {
      return 'current'
    }
    
    return 'pending'
  }

  // Show loading state
  if (isLoading) {
    return (
      <OnboardingLoadingState
        isLoading={true}
        step={1}
        stepName="Loading onboarding status"
      />
    )
  }

  // Show error state
  if (error && !onboardingState) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Error Loading Onboarding</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Button
            onClick={loadOnboardingStatus}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show completion state
  if (onboardingState?.isComplete) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Onboarding Complete! 🎉
              </h3>
              <p className="text-gray-600 mt-2">
                Welcome to the washer network! You now have full access to all features.
              </p>
            </div>
            <Button
              onClick={() => window.location.href = '/washer/dashboard'}
              className="w-full"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!onboardingState) {
    return null
  }

  const currentStepConfig = STEP_CONFIGS.find(step => step.id === onboardingState.currentStep)
  const CurrentStepComponent = currentStepConfig?.component

  return (
    <OnboardingErrorBoundary userId={userId} step={1}>
      <div className="space-y-6">
        {/* Progress Header */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Complete Your Washer Setup
                </h2>
                <p className="text-gray-600">
                  {currentStepConfig?.title} - Step {STEP_CONFIGS.findIndex(s => s.id === onboardingState.currentStep) + 1} of {STEP_CONFIGS.length}
                </p>
              </div>
              <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                {onboardingState.progress}% Complete
              </Badge>
            </div>
            <Progress value={onboardingState.progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Step Progress Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            {STEP_CONFIGS.map((step, index) => {
              const StepIcon = step.icon
              const status = getStepStatus(step.id)
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300
                      ${status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : status === 'current'
                          ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : status === 'current' ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {index < STEP_CONFIGS.length - 1 && (
                    <div
                      className={`
                        mx-2 h-0.5 w-12 transition-colors duration-300
                        ${getStepStatus(STEP_CONFIGS[index + 1].id) !== 'pending' 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                        }
                      `}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                {currentStepConfig && (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <currentStepConfig.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {currentStepConfig.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentStepConfig.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step Component */}
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
              {CurrentStepComponent && (
                <CurrentStepComponent
                  userId={userId}
                  userEmail={userEmail}
                  onboardingState={onboardingState}
                  onStepComplete={handleStepComplete}
                  onStepError={handleStepError}
                  isLoading={isTransitioning}
                />
              )}
            </div>

            {/* Loading Overlay */}
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600">Processing...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OnboardingErrorBoundary>
  )
}
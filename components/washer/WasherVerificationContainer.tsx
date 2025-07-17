'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Shield, CreditCard, FileText, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { createStripeConnectedAccount, createStripeAccountLink } from '@/lib/stripe/actions'
import { 
  withRetry, 
  showErrorToast, 
  showLoadingToast, 
  VerificationRecovery,
  getUserFriendlyErrorMessage 
} from '@/lib/error-handling'
import { useVerificationLoading } from './VerificationLoadingState'
import { 
  trackVerificationStartedAction,
  trackStripeRedirectAction,
  trackRetryAttemptAction,
  trackVerificationFailedAction
} from '@/lib/monitoring/verification-analytics-actions'
import { createSessionId } from '@/lib/monitoring/performance-utils'

interface WasherVerificationContainerProps {
  onVerificationStarted?: () => void
}

interface VerificationState {
  isLoading: boolean
  error: string | null
  retryCount: number
  canRetry: boolean
  lastAttemptTime: number | null
}

export function WasherVerificationContainer({ 
  onVerificationStarted 
}: WasherVerificationContainerProps) {
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    canRetry: true,
    lastAttemptTime: null
  })

  const [recoveryState, setRecoveryState] = useState<{
    hasRecovery: boolean
    step?: string
  }>({ hasRecovery: false })

  const [sessionId] = useState(() => createSessionId())

  const { loadingState, startLoading, updateStage, stopLoading, LoadingComponent } = useVerificationLoading()

  // Check for recovery state on component mount
  useEffect(() => {
    const recovery = VerificationRecovery.getRecoveryState()
    if (recovery) {
      setRecoveryState({
        hasRecovery: true,
        step: recovery.step
      })
    }
  }, [])

  const updateState = (updates: Partial<VerificationState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleStartVerification = async (isRetry = false) => {
    // Prevent rapid retries
    if (state.lastAttemptTime && Date.now() - state.lastAttemptTime < 2000) {
      showErrorToast(new Error('Please wait a moment before trying again'))
      return
    }

    updateState({
      isLoading: true,
      error: null,
      retryCount: isRetry ? state.retryCount + 1 : 0,
      lastAttemptTime: Date.now()
    })

    // Track verification started (if not a retry)
    if (!isRetry) {
      try {
        await trackVerificationStartedAction('current_user', sessionId, {
          component: 'WasherVerificationContainer',
          recovery_state: recoveryState.hasRecovery,
          recovery_step: recoveryState.step
        })
      } catch (error) {
        console.warn('Failed to track verification started:', error)
      }
    }

    // Save recovery state
    VerificationRecovery.saveRecoveryState('current_user', '', 'starting_verification')

    // Start loading state
    startLoading('initializing', 'Setting up your verification process...', state.retryCount)

    try {
      const result = await withRetry(
        async () => {
          // First, create or get the Stripe Connect account
          updateStage('creating_account', 'Creating your secure payment account...')
          const accountResult = await createStripeConnectedAccount(sessionId)
          
          if (!accountResult.success) {
            throw new Error(accountResult.message || 'Failed to create payment account')
          }

          // Update loading stage
          updateStage('generating_link', 'Creating your verification link...')

          // Then create the onboarding link
          const linkResult = await createStripeAccountLink(accountResult.accountId!, sessionId)
          
          if (!linkResult.success) {
            throw new Error(linkResult.message || 'Failed to create verification link')
          }

          return {
            accountId: accountResult.accountId!,
            url: linkResult.url!
          }
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000
        },
        async (attempt, error) => {
          console.log(`Verification attempt ${attempt} failed:`, error)
          updateStage('initializing', `Retrying... (${attempt}/3)`, 20 + (attempt * 10))
          
          // Track retry attempt
          try {
            await trackRetryAttemptAction('current_user', sessionId, 'verification_start', attempt, error, {
              component: 'WasherVerificationContainer',
              stage: 'initialization'
            })
          } catch (trackError) {
            console.warn('Failed to track retry attempt:', trackError)
          }
        }
      )

      // Update to redirecting stage
      updateStage('redirecting', 'Taking you to the verification process...')

      // Track successful redirect to Stripe
      try {
        await trackStripeRedirectAction('current_user', result.accountId, sessionId, {
          component: 'WasherVerificationContainer',
          url: result.url,
          retry_count: state.retryCount
        })
      } catch (error) {
        console.warn('Failed to track Stripe redirect:', error)
      }

      // Clear recovery state since we're about to redirect
      VerificationRecovery.clearRecoveryState()

      // Notify parent component if callback provided
      onVerificationStarted?.()

      // Save successful state before redirect
      VerificationRecovery.saveRecoveryState('current_user', result.accountId, 'redirecting_to_stripe')

      // Small delay to show the redirecting message
      setTimeout(() => {
        window.location.href = result.url
      }, 1000)

    } catch (err) {
      console.error('Error starting verification:', err)
      
      // Stop loading state
      stopLoading()

      const errorInfo = getUserFriendlyErrorMessage(err)
      
      updateState({
        isLoading: false,
        error: errorInfo.description,
        canRetry: errorInfo.canRetry && state.retryCount < 3
      })

      // Track verification failure
      try {
        await trackVerificationFailedAction('current_user', undefined, sessionId, err instanceof Error ? err : new Error(String(err)), 'verification_start', {
          component: 'WasherVerificationContainer',
          retry_count: state.retryCount,
          can_retry: errorInfo.canRetry,
          error_type: errorInfo.type
        })
      } catch (trackError) {
        console.warn('Failed to track verification failure:', trackError)
      }

      // Show error toast with retry option if applicable
      if (errorInfo.canRetry && state.retryCount < 3) {
        showErrorToast(err, () => handleStartVerification(true))
      } else {
        showErrorToast(err)
      }
    }
  }

  const handleClearError = () => {
    updateState({ error: null, canRetry: true })
  }

  const handleRecoveryAction = () => {
    VerificationRecovery.clearRecoveryState()
    setRecoveryState({ hasRecovery: false })
    handleStartVerification()
  }

  const verificationSteps = [
    {
      icon: Shield,
      title: 'Identity Verification',
      description: 'Verify your identity with a government-issued ID to ensure platform security.'
    },
    {
      icon: CreditCard,
      title: 'Payment Setup',
      description: 'Connect your bank account to receive payments for completed bookings.'
    },
    {
      icon: FileText,
      title: 'Business Information',
      description: 'Provide basic business details required for tax and compliance purposes.'
    }
  ]

  return (
    <>
      {LoadingComponent}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center" data-testid="verification-container">
        <div className="w-full max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Complete Your Washer Verification
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              To start accepting bookings and receiving payments, you need to complete our secure verification process.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Recovery State Alert */}
            {recoveryState.hasRecovery && (
              <Alert data-testid="recovery-alert">
                <Clock className="h-4 w-4" />
                <AlertTitle>Resume Verification</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    It looks like you started verification before. Would you like to continue where you left off?
                  </span>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecoveryState({ hasRecovery: false })}
                      data-testid="start-fresh-btn"
                    >
                      Start Fresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleRecoveryAction}
                      disabled={state.isLoading}
                      data-testid="continue-verification-btn"
                    >
                      Continue
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error State Alert */}
            {state.error && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Verification Error
                  {state.retryCount > 0 && (
                    <span className="ml-2 text-sm font-normal">
                      (Attempt {state.retryCount + 1})
                    </span>
                  )}
                </AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{state.error}</span>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearError}
                      data-testid="dismiss-error-btn"
                    >
                      Dismiss
                    </Button>
                    {state.canRetry && (
                      <Button
                        size="sm"
                        onClick={() => handleStartVerification(true)}
                        disabled={state.isLoading}
                        data-testid="retry-btn"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Try Again
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-3 gap-6" data-testid="verification-steps">
              {verificationSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Why do we need verification?
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Ensures the safety and security of our platform</li>
                    <li>• Complies with financial regulations and anti-money laundering laws</li>
                    <li>• Protects both washers and customers from fraud</li>
                    <li>• Enables secure payment processing and payouts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <Button 
                onClick={() => handleStartVerification()}
                disabled={state.isLoading}
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
                data-testid="start-verification-btn"
              >
                {state.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {state.retryCount > 0 ? `Retrying... (${state.retryCount + 1}/3)` : 'Starting Verification...'}
                  </>
                ) : (
                  'Start Verification Process'
                )}
              </Button>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The verification process typically takes 2-5 minutes to complete.
                <br />
                You'll be redirected to our secure verification partner.
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Need Help?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  If you encounter any issues during verification, please{' '}
                  <a href="mailto:support@example.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    contact our support team
                  </a>
                  {' '}for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  )
}
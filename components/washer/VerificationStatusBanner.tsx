'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { createStripeAccountLink } from '@/lib/stripe/actions'
import type { StripeAccountStatus } from '@/lib/stripe/actions'
import { 
  withRetry, 
  showErrorToast, 
  showLoadingToast, 
  showVerificationStatusToast,
  getUserFriendlyErrorMessage 
} from '@/lib/error-handling'
import { 
  trackStripeRedirectAction,
  trackRetryAttemptAction,
  trackVerificationFailedAction
} from '@/lib/monitoring/verification-analytics-actions'
import { createSessionId } from '@/lib/monitoring/performance-utils'

interface VerificationStatusBannerProps {
  status: StripeAccountStatus
  accountId?: string
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
    disabled_reason?: string
  }
  nextSteps?: string[]
  onStatusUpdate?: () => void
  previousStatus?: StripeAccountStatus
}

interface BannerState {
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  retryCount: number
  canRetry: boolean
  lastAttemptTime: number | null
}

export function VerificationStatusBanner({
  status,
  accountId,
  requirements,
  nextSteps = [],
  onStatusUpdate,
  previousStatus
}: VerificationStatusBannerProps) {
  const [state, setState] = useState<BannerState>({
    isLoading: false,
    isRefreshing: false,
    error: null,
    retryCount: 0,
    canRetry: true,
    lastAttemptTime: null
  })

  const [sessionId] = useState(() => createSessionId())

  // Show toast notification when status changes
  useEffect(() => {
    if (status !== previousStatus && previousStatus) {
      showVerificationStatusToast(status, previousStatus)
    }
  }, [status, previousStatus])

  const updateState = (updates: Partial<BannerState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleContinueVerification = async (isRetry = false) => {
    if (!accountId) {
      showErrorToast(new Error('No account ID available'))
      return
    }

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

    // Show loading toast
    const loadingToast = showLoadingToast('Creating new verification link...')

    try {
      const result = await withRetry(
        async () => {
          const linkResult = await createStripeAccountLink(accountId, sessionId)
          
          if (!linkResult.success) {
            throw new Error(linkResult.message || 'Failed to create verification link')
          }

          return linkResult.url!
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000
        },
        async (attempt, error) => {
          console.log(`Verification link attempt ${attempt} failed:`, error)
          loadingToast.update({
            id: loadingToast.id,
            title: `Retrying... (${attempt}/3)`,
            description: 'Having trouble creating verification link.'
          })
          
          // Track retry attempt
          try {
            await trackRetryAttemptAction('current_user', sessionId, 'continue_verification', attempt, error instanceof Error ? error : new Error(String(error)), {
              component: 'VerificationStatusBanner',
              account_id: accountId,
              current_status: status
            })
          } catch (trackError) {
            console.warn('Failed to track retry attempt:', trackError)
          }
        }
      )

      // Success - dismiss loading toast
      loadingToast.dismiss()

      // Track successful redirect to Stripe
      try {
        await trackStripeRedirectAction('current_user', accountId, sessionId, {
          component: 'VerificationStatusBanner',
          url: result,
          current_status: status,
          retry_count: state.retryCount
        })
      } catch (trackError) {
        console.warn('Failed to track Stripe redirect:', trackError)
      }

      // Redirect to Stripe onboarding
      window.location.href = result

    } catch (err) {
      console.error('Error continuing verification:', err)
      
      // Dismiss loading toast
      loadingToast.dismiss()

      // Track verification failure
      try {
        await trackVerificationFailedAction(
          'current_user',
          accountId,
          sessionId,
          err instanceof Error ? err : new Error(String(err)),
          'continue_verification',
          {
            component: 'VerificationStatusBanner',
            current_status: status,
            retry_count: state.retryCount,
            final_failure: state.retryCount >= 2
          }
        )
      } catch (trackError) {
        console.warn('Failed to track verification failure:', trackError)
      }

      const errorInfo = getUserFriendlyErrorMessage(err)
      
      updateState({
        isLoading: false,
        error: errorInfo.description,
        canRetry: errorInfo.canRetry && state.retryCount < 3
      })

      // Show error toast with retry option if applicable
      if (errorInfo.canRetry && state.retryCount < 3) {
        showErrorToast(err, () => handleContinueVerification(true))
      } else {
        showErrorToast(err)
      }
    }
  }

  const handleRefreshStatus = async () => {
    if (!onStatusUpdate) return

    updateState({ isRefreshing: true, error: null })

    try {
      await withRetry(
        async () => {
          await onStatusUpdate()
        },
        {
          maxAttempts: 2,
          baseDelay: 500,
          maxDelay: 2000
        }
      )
    } catch (err) {
      console.error('Error refreshing status:', err)
      showErrorToast(err, handleRefreshStatus)
    } finally {
      updateState({ isRefreshing: false })
    }
  }

  const handleClearError = () => {
    updateState({ error: null, canRetry: true })
  }

  const getStatusConfig = (status: StripeAccountStatus) => {
    switch (status) {
      case 'incomplete':
        return {
          icon: AlertCircle,
          variant: 'destructive' as const,
          badgeVariant: 'destructive' as const,
          title: 'Verification Incomplete',
          description: 'Your account verification is not yet complete. Please continue the verification process to start accepting bookings.',
          showContinueButton: true
        }
      case 'pending':
        return {
          icon: Clock,
          variant: 'default' as const,
          badgeVariant: 'secondary' as const,
          title: 'Verification Under Review',
          description: 'Your verification documents are being reviewed. This typically takes 1-2 business days.',
          showContinueButton: false
        }
      case 'requires_action':
        return {
          icon: AlertCircle,
          variant: 'destructive' as const,
          badgeVariant: 'destructive' as const,
          title: 'Action Required',
          description: 'Additional information is needed to complete your verification. Please provide the required details.',
          showContinueButton: true
        }
      case 'rejected':
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          badgeVariant: 'destructive' as const,
          title: 'Verification Issues',
          description: 'There were issues with your verification. Please contact support for assistance.',
          showContinueButton: false
        }
      case 'complete':
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          badgeVariant: 'default' as const,
          title: 'Verification Complete',
          description: 'Your account is fully verified and ready to accept bookings!',
          showContinueButton: false
        }
      default:
        return {
          icon: AlertCircle,
          variant: 'default' as const,
          badgeVariant: 'secondary' as const,
          title: 'Unknown Status',
          description: 'Unable to determine verification status.',
          showContinueButton: false
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  // Don't show banner for complete status
  if (status === 'complete') {
    return null
  }

  return (
    <div className="mb-6">
      <Alert variant={config.variant} data-testid="verification-status-banner">
        <Icon className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTitle>{config.title}</AlertTitle>
              <Badge variant={config.badgeVariant} className="text-xs">
                {status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <AlertDescription className="mb-3">
              {config.description}
            </AlertDescription>

            {/* Show specific requirements if available */}
            {requirements && (
              <div className="space-y-2 text-sm">
                {requirements.currently_due.length > 0 && (
                  <div>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      Required now:
                    </span>
                    <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-300">
                      {requirements.currently_due.map((req, index) => (
                        <li key={index}>{req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {requirements.past_due.length > 0 && (
                  <div>
                    <span className="font-medium text-red-700 dark:text-red-300">
                      Overdue:
                    </span>
                    <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-300">
                      {requirements.past_due.map((req, index) => (
                        <li key={index}>{req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {requirements.pending_verification.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      Under review:
                    </span>
                    <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-300">
                      {requirements.pending_verification.map((req, index) => (
                        <li key={index}>{req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {requirements.disabled_reason && (
                  <div>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      Issue:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                      {requirements.disabled_reason}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Show next steps if available */}
            {nextSteps.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Next steps:
                </span>
                <ul className="list-disc list-inside ml-2 text-sm text-gray-600 dark:text-gray-300">
                  {nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error State Display */}
            {state.error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {state.error}
                    {state.retryCount > 0 && (
                      <span className="ml-2 text-xs">
                        (Attempt {state.retryCount + 1})
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearError}
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                    {state.canRetry && (
                      <Button
                        size="sm"
                        onClick={() => handleContinueVerification(true)}
                        disabled={state.isLoading}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {config.showContinueButton && (
              <Button
                onClick={() => handleContinueVerification()}
                disabled={state.isLoading}
                size="sm"
                className="whitespace-nowrap"
                data-testid="continue-verification-btn"
              >
                {state.isLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    {state.retryCount > 0 ? `Retrying... (${state.retryCount + 1}/3)` : 'Loading...'}
                  </>
                ) : (
                  <>
                    Continue Verification
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}

            {onStatusUpdate && (
              <Button
                onClick={handleRefreshStatus}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                disabled={state.isRefreshing}
                data-testid="refresh-status-btn"
              >
                {state.isRefreshing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh Status
                  </>
                )}
              </Button>
            )}

            {status === 'rejected' && (
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                asChild
                data-testid="contact-support-btn"
              >
                <a href="mailto:support@example.com">
                  Contact Support
                </a>
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  )
}
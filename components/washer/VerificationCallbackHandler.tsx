'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { processVerificationCallback } from '@/lib/stripe/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { 
  withRetry, 
  showErrorToast, 
  showVerificationStatusToast,
  VerificationRecovery 
} from '@/lib/error-handling'
import { 
  trackCallbackReceivedAction,
  trackVerificationFailedAction,
  trackRetryAttemptAction
} from '@/lib/monitoring/verification-analytics-actions'
import { createSessionId } from '@/lib/monitoring/performance-utils'

interface CallbackState {
  processing: boolean
  retryCount: number
  canRetry: boolean
  message: {
    type: 'success' | 'error' | 'info'
    text: string
  } | null
}

export function VerificationCallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<CallbackState>({
    processing: false,
    retryCount: 0,
    canRetry: true,
    message: null
  })

  const [sessionId] = useState(() => createSessionId())

  const updateState = (updates: Partial<CallbackState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const processCallbackWithRetry = async (isRetry = false) => {
    updateState({
      processing: true,
      retryCount: isRetry ? state.retryCount + 1 : 0,
      message: {
        type: 'info',
        text: isRetry 
          ? `Retrying verification processing... (${state.retryCount + 1}/3)`
          : 'Processing your verification status...'
      }
    })

    try {
      console.log('[CALLBACK_HANDLER] Processing verification callback...')
      
      const result = await withRetry(
        async () => {
          const callbackResult = await processVerificationCallback()
          if (!callbackResult.success) {
            throw new Error(callbackResult.error?.message || 'Failed to process verification callback')
          }
          return callbackResult
        },
        {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 8000
        },
        async (attempt, error) => {
          console.log(`Callback processing attempt ${attempt} failed:`, error)
          updateState({
            message: {
              type: 'info',
              text: `Retrying verification processing... (${attempt}/3)`
            }
          })
          
          // Track retry attempt
          try {
            await trackRetryAttemptAction('current_user', sessionId, 'callback_processing', attempt, error, {
              component: 'VerificationCallbackHandler',
              retry_count: state.retryCount
            })
          } catch (trackError) {
            console.warn('Failed to track retry attempt:', trackError)
          }
        }
      )

      console.log('[CALLBACK_HANDLER] Verification callback processed successfully:', result.data)
      
      // Track successful callback processing
      try {
        if (result.data?.status && result.data?.accountId) {
          await trackCallbackReceivedAction(
            'current_user',
            result.data.accountId,
            sessionId,
            result.data.previousStatus || 'unknown',
            result.data.status,
            result.data.statusChanged || false,
            Date.now() - state.lastAttemptTime || 0,
            {
              component: 'VerificationCallbackHandler',
              retry_count: state.retryCount,
              success: true
            }
          )
        }
      } catch (trackError) {
        console.warn('Failed to track callback received:', trackError)
      }
      
      // Clear recovery state since verification was processed successfully
      VerificationRecovery.clearRecoveryState()
      
      // Show success toast notification
      if (result.data?.status && result.data?.previousStatus) {
        showVerificationStatusToast(result.data.status, result.data.previousStatus)
      }
      
      updateState({
        processing: false,
        message: {
          type: 'success',
          text: result.message || 'Verification status updated successfully!'
        }
      })
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('onboarding')
      newUrl.searchParams.delete('connect_success')
      
      // Replace the current URL without the callback parameters
      router.replace(newUrl.pathname + newUrl.search)
      
      // Refresh the page after a short delay to show updated verification status
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('[CALLBACK_HANDLER] Error processing verification callback:', error)
      
      // Track verification failure
      try {
        await trackVerificationFailedAction(
          'current_user',
          undefined,
          sessionId,
          error instanceof Error ? error : new Error(String(error)),
          'callback_processing',
          {
            component: 'VerificationCallbackHandler',
            retry_count: state.retryCount,
            final_failure: state.retryCount >= 2
          }
        )
      } catch (trackError) {
        console.warn('Failed to track verification failure:', trackError)
      }
      
      updateState({
        processing: false,
        canRetry: state.retryCount < 2,
        message: {
          type: 'error',
          text: state.retryCount >= 2 
            ? 'Failed to process verification after multiple attempts. Please refresh the page or contact support.'
            : 'Failed to process verification. You can try again or refresh the page.'
        }
      })

      // Show error toast
      showErrorToast(error, state.retryCount < 2 ? () => processCallbackWithRetry(true) : undefined)
      
      // Auto-refresh after final failure
      if (state.retryCount >= 2) {
        setTimeout(() => {
          router.refresh()
        }, 8000)
      }
    }
  }

  useEffect(() => {
    const handleCallback = async () => {
      const onboardingComplete = searchParams.get('onboarding')
      const connectSuccess = searchParams.get('connect_success')
      const refresh = searchParams.get('refresh')
      
      // Handle callback parameters from Stripe onboarding
      if (onboardingComplete === 'complete' || connectSuccess === 'true') {
        await processCallbackWithRetry()
      }
      
      // Handle refresh parameter (when user returns from failed onboarding)
      else if (refresh === 'true') {
        updateState({
          message: {
            type: 'info',
            text: 'Please try the verification process again.'
          }
        })
        
        // Clean up URL parameter
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('refresh')
        router.replace(newUrl.pathname + newUrl.search)
        
        // Clear message after a few seconds
        setTimeout(() => {
          updateState({ message: null })
        }, 4000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  // Don't render anything if no message to show
  if (!state.message && !state.processing) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert 
        variant={state.message?.type === 'error' ? 'destructive' : 'default'}
        className={`shadow-lg border-2 ${
          state.message?.type === 'success' 
            ? 'border-green-200 bg-green-50' 
            : state.message?.type === 'error'
            ? 'border-red-200 bg-red-50'
            : 'border-blue-200 bg-blue-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {state.processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : state.message?.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            <AlertDescription className={`font-medium ${
              state.message?.type === 'success' 
                ? 'text-green-800' 
                : state.message?.type === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}>
              {state.message?.text || 'Processing...'}
            </AlertDescription>
          </div>
          
          {/* Show retry button for failed processing */}
          {state.message?.type === 'error' && state.canRetry && !state.processing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => processCallbackWithRetry(true)}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}
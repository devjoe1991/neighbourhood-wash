'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { 
  OnboardingState,
  startStripeVerification,
  completeStripeVerification,
} from '@/lib/onboarding/onboarding-service'

interface StripeVerificationStepProps {
  userId: string
  userEmail?: string
  onboardingState: OnboardingState
  onStepComplete: (step: 'verification_pending', data?: any) => Promise<void>
  onStepError: (step: 'verification_pending', error: string, data?: any) => Promise<void>
  isLoading: boolean
}

type VerificationStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'failed'

export function StripeVerificationStep({
  userId,
  userEmail,
  onboardingState,
  onStepComplete,
  onStepError,
  isLoading,
}: StripeVerificationStepProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_started')
  const [isStartingVerification, setIsStartingVerification] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check verification status on mount and when returning from Stripe
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setIsCheckingStatus(true)
        setError(null)

        // Check URL parameters for Stripe callback
        const urlParams = new URLSearchParams(window.location.search)
        const connectSuccess = urlParams.get('connect_success')
        const refresh = urlParams.get('refresh')

        if (connectSuccess === 'true') {
          // User returned from successful Stripe onboarding
          setVerificationStatus('completed')
          
          // Complete the verification step
          const result = await completeStripeVerification(userId)
          if (result.success) {
            await onStepComplete('verification_pending')
          } else {
            setError(result.error?.message || 'Failed to complete verification')
            setVerificationStatus('failed')
          }
          
          // Clean up URL parameters
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('connect_success')
          window.history.replaceState({}, '', newUrl.toString())
          
        } else if (refresh === 'true') {
          // User returned from failed/incomplete onboarding
          setVerificationStatus('failed')
          setError('Verification was not completed. Please try again.')
          
          // Clean up URL parameters
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('refresh')
          window.history.replaceState({}, '', newUrl.toString())
          
        } else {
          // Check current status based on onboarding state
          if (onboardingState.stripeAccountId && onboardingState.stripeAccountStatus === 'complete') {
            setVerificationStatus('completed')
          } else if (onboardingState.stripeAccountId) {
            setVerificationStatus('pending')
          } else {
            setVerificationStatus('not_started')
          }
        }
        
      } catch (err) {
        console.error('Error checking verification status:', err)
        setError('Failed to check verification status')
        setVerificationStatus('failed')
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkVerificationStatus()
  }, [userId, onboardingState, onStepComplete])

  // Start Stripe verification process
  const handleStartVerification = async () => {
    try {
      setIsStartingVerification(true)
      setError(null)

      const result = await startStripeVerification(userId)
      
      if (result.success && result.data) {
        setOnboardingUrl(result.data.onboardingUrl)
        setVerificationStatus('in_progress')
        
        // Redirect to Stripe onboarding
        window.location.href = result.data.onboardingUrl
      } else {
        setError(result.error?.message || 'Failed to start verification')
        setVerificationStatus('failed')
        await onStepError('verification_pending', result.error?.message || 'Failed to start verification')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start verification'
      setError(errorMessage)
      setVerificationStatus('failed')
      await onStepError('verification_pending', errorMessage)
    } finally {
      setIsStartingVerification(false)
    }
  }

  // Retry verification
  const handleRetryVerification = async () => {
    setVerificationStatus('not_started')
    setError(null)
    await handleStartVerification()
  }

  // Check verification status manually
  const handleCheckStatus = async () => {
    try {
      setIsCheckingStatus(true)
      setError(null)

      const result = await completeStripeVerification(userId)
      
      if (result.success) {
        setVerificationStatus('completed')
        await onStepComplete('verification_pending')
      } else {
        setError('Verification is still pending. Please complete the process with Stripe.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status'
      setError(errorMessage)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'pending':
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'pending':
      case 'in_progress':
        return <Clock className="h-6 w-6 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      default:
        return <Shield className="h-6 w-6 text-blue-600" />
    }
  }

  if (isCheckingStatus && verificationStatus === 'not_started') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Checking verification status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium text-gray-900">Identity Verification</h4>
                <p className="text-sm text-gray-600">
                  Verify your identity with Stripe Connect
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Content */}
      {verificationStatus === 'not_started' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Identity Verification Required
              </h3>
              <p className="text-gray-600 mt-2">
                To receive payments as a washer, we need to verify your identity through Stripe Connect.
                This is a secure process that helps protect both you and our customers.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Government-issued photo ID (passport, driving licence)</li>
              <li>• Your address and date of birth</li>
              <li>• Bank account details for payouts</li>
              <li>• About 5-10 minutes to complete</li>
            </ul>
          </div>

          <Button
            onClick={handleStartVerification}
            disabled={isStartingVerification || isLoading}
            className="w-full"
            size="lg"
          >
            {isStartingVerification ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Verification...
              </>
            ) : (
              <>
                Start Identity Verification
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {verificationStatus === 'pending' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verification In Progress
              </h3>
              <p className="text-gray-600 mt-2">
                Your identity verification is being processed. This usually takes a few minutes,
                but can take up to 24 hours in some cases.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleCheckStatus}
              disabled={isCheckingStatus}
              variant="outline"
              className="flex-1"
            >
              {isCheckingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </>
              )}
            </Button>
            
            {onboardingUrl && (
              <Button
                onClick={() => window.location.href = onboardingUrl}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Continue with Stripe
              </Button>
            )}
          </div>
        </div>
      )}

      {verificationStatus === 'failed' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verification Failed
              </h3>
              <p className="text-gray-600 mt-2">
                There was an issue with your identity verification. Please try again or contact support if the problem persists.
              </p>
            </div>
          </div>

          <Button
            onClick={handleRetryVerification}
            disabled={isStartingVerification}
            className="w-full"
            size="lg"
          >
            {isStartingVerification ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Verification
              </>
            )}
          </Button>
        </div>
      )}

      {verificationStatus === 'completed' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verification Complete! ✅
              </h3>
              <p className="text-gray-600 mt-2">
                Your identity has been successfully verified. You can now proceed to the next step.
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>Next:</strong> Connect your bank account to receive payments for your washing services.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
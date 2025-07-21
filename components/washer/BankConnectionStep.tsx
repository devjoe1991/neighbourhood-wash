'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import { 
  OnboardingState,
} from '@/lib/onboarding/onboarding-service'
import { createClient } from '@/utils/supabase/client'

interface BankConnectionStepProps {
  userId: string
  userEmail?: string
  onboardingState: OnboardingState
  onStepComplete: (step: 'verification_complete', data?: any) => Promise<void>
  onStepError: (step: 'verification_complete', error: string, data?: any) => Promise<void>
  isLoading: boolean
}

type BankConnectionStatus = 'not_connected' | 'connecting' | 'connected' | 'failed'

export function BankConnectionStep({
  userId,
  userEmail,
  onboardingState,
  onStepComplete,
  onStepError,
  isLoading,
}: BankConnectionStepProps) {
  const [connectionStatus, setConnectionStatus] = useState<BankConnectionStatus>('not_connected')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankDetails, setBankDetails] = useState<{
    bankName?: string
    accountType?: string
    last4?: string
  }>({})

  // Check bank connection status
  useEffect(() => {
    const checkBankStatus = async () => {
      try {
        setIsCheckingStatus(true)
        setError(null)

        const supabase = createClient()
        
        // Get washer profile with Stripe account info
        const { data: washerProfile } = await supabase
          .from('washer_profiles')
          .select('stripe_account_id, stripe_account_status')
          .eq('user_id', userId)
          .single()

        if (!washerProfile?.stripe_account_id) {
          setError('Stripe account not found. Please complete identity verification first.')
          setConnectionStatus('failed')
          return
        }

        // Check if bank account is connected via our backend
        const response = await fetch('/api/stripe/check-bank-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: washerProfile.stripe_account_id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          if (result.data.hasBank) {
            setConnectionStatus('connected')
            setBankDetails({
              bankName: result.data.bankName,
              accountType: result.data.accountType,
              last4: result.data.last4,
            })
            
            // Auto-complete this step if bank is connected
            await onStepComplete('verification_complete')
          } else {
            setConnectionStatus('not_connected')
          }
        } else {
          setError(result.error || 'Failed to check bank connection status')
          setConnectionStatus('failed')
        }

      } catch (err) {
        console.error('Error checking bank status:', err)
        setError('Failed to check bank connection status')
        setConnectionStatus('failed')
      } finally {
        setIsCheckingStatus(false)
      }
    }

    if (onboardingState.stripeAccountId) {
      checkBankStatus()
    }
  }, [userId, onboardingState.stripeAccountId, onStepComplete])

  // Start bank connection process
  const handleConnectBank = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      const supabase = createClient()
      
      // Get Stripe account ID
      const { data: washerProfile } = await supabase
        .from('washer_profiles')
        .select('stripe_account_id')
        .eq('user_id', userId)
        .single()

      if (!washerProfile?.stripe_account_id) {
        setError('Stripe account not found. Please complete identity verification first.')
        return
      }

      // Create account link for bank connection
      const response = await fetch('/api/stripe/create-bank-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: washerProfile.stripe_account_id,
          refreshUrl: `${window.location.origin}/washer/onboarding?step=3&refresh=true`,
          returnUrl: `${window.location.origin}/washer/onboarding?step=3&bank_success=true`,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.url) {
        setConnectionStatus('connecting')
        // Redirect to Stripe for bank connection
        window.location.href = result.data.url
      } else {
        setError(result.error || 'Failed to create bank connection link')
        setConnectionStatus('failed')
        await onStepError('verification_complete', result.error || 'Failed to create bank connection link')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account'
      setError(errorMessage)
      setConnectionStatus('failed')
      await onStepError('verification_complete', errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  // Retry bank connection
  const handleRetryConnection = async () => {
    setConnectionStatus('not_connected')
    setError(null)
    await handleConnectBank()
  }

  // Check connection status manually
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true)
    // Re-run the status check
    const checkBankStatus = async () => {
      try {
        setError(null)

        const supabase = createClient()
        
        const { data: washerProfile } = await supabase
          .from('washer_profiles')
          .select('stripe_account_id')
          .eq('user_id', userId)
          .single()

        if (!washerProfile?.stripe_account_id) {
          setError('Stripe account not found')
          return
        }

        const response = await fetch('/api/stripe/check-bank-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: washerProfile.stripe_account_id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          if (result.data.hasBank) {
            setConnectionStatus('connected')
            setBankDetails({
              bankName: result.data.bankName,
              accountType: result.data.accountType,
              last4: result.data.last4,
            })
            await onStepComplete('verification_complete')
          } else {
            setError('Bank account is not yet connected. Please complete the process with Stripe.')
          }
        } else {
          setError(result.error || 'Failed to check bank status')
        }

      } catch (err) {
        setError('Failed to check bank connection status')
      }
    }

    await checkBankStatus()
    setIsCheckingStatus(false)
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Connecting</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Not Connected</Badge>
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'connecting':
        return <Clock className="h-6 w-6 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      default:
        return <Building className="h-6 w-6 text-blue-600" />
    }
  }

  if (isCheckingStatus && connectionStatus === 'not_connected') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Checking bank connection status...</span>
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
                <h4 className="font-medium text-gray-900">Bank Account Connection</h4>
                <p className="text-sm text-gray-600">
                  Connect your bank account to receive payments
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

      {/* Bank Connection Content */}
      {connectionStatus === 'not_connected' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Connect Your Bank Account
              </h3>
              <p className="text-gray-600 mt-2">
                To receive payments for your washing services, you need to connect a UK bank account.
                This is handled securely through Stripe.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• UK bank account details</li>
              <li>• Account holder name (must match your verified identity)</li>
              <li>• Sort code and account number</li>
              <li>• About 2-3 minutes to complete</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Secure & Fast Payments</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Once connected, you'll receive payments within 2-3 business days after completing jobs.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConnectBank}
            disabled={isConnecting || isLoading}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Stripe...
              </>
            ) : (
              <>
                Connect Bank Account
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Connection In Progress
              </h3>
              <p className="text-gray-600 mt-2">
                Please complete the bank account connection process with Stripe.
                You'll be redirected back here once it's complete.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            variant="outline"
            className="w-full"
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Connection Status
              </>
            )}
          </Button>
        </div>
      )}

      {connectionStatus === 'failed' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Connection Failed
              </h3>
              <p className="text-gray-600 mt-2">
                There was an issue connecting your bank account. Please try again or contact support if the problem persists.
              </p>
            </div>
          </div>

          <Button
            onClick={handleRetryConnection}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Bank Connection
              </>
            )}
          </Button>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Account Connected! ✅
              </h3>
              <p className="text-gray-600 mt-2">
                Your bank account has been successfully connected. You're ready to receive payments!
              </p>
            </div>
          </div>

          {bankDetails.bankName && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      {bankDetails.bankName}
                    </p>
                    <p className="text-sm text-green-700">
                      {bankDetails.accountType} ending in {bankDetails.last4}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>Next:</strong> Complete the onboarding process by paying the £15 setup fee.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
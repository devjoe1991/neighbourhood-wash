'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Users,
  Headphones,
  Star,
} from 'lucide-react'
import { 
  OnboardingState,
  completePaymentSetup,
} from '@/lib/onboarding/onboarding-service'

interface PaymentSetupStepProps {
  userId: string
  userEmail?: string
  onboardingState: OnboardingState
  onStepComplete: (step: 'payment_setup', data?: any) => Promise<void>
  onStepError: (step: 'payment_setup', error: string, data?: any) => Promise<void>
  isLoading: boolean
}

export function PaymentSetupStep({
  userId,
  userEmail,
  onboardingState,
  onStepComplete,
  onStepError,
  isLoading,
}: PaymentSetupStepProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onboardingFee = 15 // £15

  // Handle payment processing
  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true)
      setError(null)

      // Create Stripe Checkout session for onboarding fee
      const response = await fetch('/api/stripe/create-onboarding-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: onboardingFee * 100, // Convert to pence
          successUrl: `${window.location.origin}/washer/onboarding?step=4&payment_success=true`,
          cancelUrl: `${window.location.origin}/washer/onboarding?step=4&payment_cancelled=true`,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url
      } else {
        setError(result.error || 'Failed to create payment session')
        await onStepError('payment_setup', result.error || 'Failed to create payment session')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment'
      setError(errorMessage)
      await onStepError('payment_setup', errorMessage)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle successful payment return
  const handlePaymentSuccess = async () => {
    try {
      setIsProcessingPayment(true)
      setError(null)

      const result = await completePaymentSetup(userId)
      
      if (result.success) {
        await onStepComplete('payment_setup')
      } else {
        setError(result.error?.message || 'Failed to complete onboarding')
        await onStepError('payment_setup', result.error?.message || 'Failed to complete onboarding')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding'
      setError(errorMessage)
      await onStepError('payment_setup', errorMessage)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Check for payment success/cancel in URL params
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment_success')
    const paymentCancelled = urlParams.get('payment_cancelled')

    if (paymentSuccess === 'true') {
      handlePaymentSuccess()
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('payment_success')
      window.history.replaceState({}, '', newUrl.toString())
      
    } else if (paymentCancelled === 'true') {
      setError('Payment was cancelled. Please try again to complete your onboarding.')
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('payment_cancelled')
      window.history.replaceState({}, '', newUrl.toString())
    }
  })

  return (
    <div className="space-y-6">
      {/* Payment Status Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Onboarding Fee</h4>
                <p className="text-sm text-gray-600">
                  One-time £{onboardingFee} setup fee
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              £{onboardingFee}
            </Badge>
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

      {/* Payment Content */}
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Complete Your Setup
            </h3>
            <p className="text-gray-600 mt-2">
              Pay the one-time £{onboardingFee} onboarding fee to unlock all washer features and start earning.
            </p>
          </div>
        </div>

        {/* What's Included */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <h4 className="font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              What's Included in Your Onboarding Fee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Identity Verification</p>
                  <p className="text-sm text-green-700">Background checks and fraud prevention</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Trusted Network Access</p>
                  <p className="text-sm text-green-700">Join our verified washer community</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Headphones className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">24/7 Support</p>
                  <p className="text-sm text-green-700">Dedicated support for all washers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Premium Features</p>
                  <p className="text-sm text-green-700">Advanced booking and earnings tools</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Potential */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-3">
              Start Earning Immediately
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-900">£15-25</p>
                <p className="text-sm text-blue-700">Per load</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">£200+</p>
                <p className="text-sm text-blue-700">Per week</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">85%</p>
                <p className="text-sm text-blue-700">You keep</p>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-3 text-center">
              Most washers earn back their onboarding fee within their first few jobs!
            </p>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            disabled={isProcessingPayment || isLoading}
            className="w-full"
            size="lg"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                Pay £{onboardingFee} & Complete Setup
                <CreditCard className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure payment processed by Stripe • One-time fee • No recurring charges
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <p className="text-xs text-gray-600">
                Your payment information is secure and encrypted. We use Stripe for payment processing and never store your card details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
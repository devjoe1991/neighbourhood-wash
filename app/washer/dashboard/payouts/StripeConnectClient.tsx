'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { createStripeOnboardingLink } from './actions' // UPDATED IMPORT
import { toast } from 'sonner'

export default function StripeConnectClient() {
  const [isPending, startTransition] = useTransition()
  const [connectSuccess, setConnectSuccess] = useState(false)

  useEffect(() => {
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('connect_success') === 'true') {
      setConnectSuccess(true)
      toast.success('Stripe account connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnectStripe = () => {
    startTransition(async () => {
      const result = await createStripeOnboardingLink()

      if (result.success && result.url) {
        // Redirect to Stripe onboarding
        toast.success('Redirecting to Stripe for account setup...')
        window.location.href = result.url
      } else {
        toast.error(result.message || 'An unexpected error occurred.')
      }
    })
  }

  return (
    <div className='space-y-4'>
      {/* Success Alert */}
      {connectSuccess && (
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            Your payment account has been successfully connected! You can now
            receive payouts for completed bookings.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleConnectStripe}
        disabled={isPending}
        size='lg'
        className='w-full'
      >
        {isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Setting up connection...
          </>
        ) : (
          <>
            <CreditCard className='mr-2 h-4 w-4' />
            Connect with Stripe
          </>
        )}
      </Button>

      <p className='text-center text-xs text-gray-500'>
        By connecting with Stripe, you agree to Stripe's{' '}
        <a
          href='https://stripe.com/en-gb/connect-account/legal'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:underline'
        >
          Connected Account Agreement
        </a>
      </p>
    </div>
  )
}

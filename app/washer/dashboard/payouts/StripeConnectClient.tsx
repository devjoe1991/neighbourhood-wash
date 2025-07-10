'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import {
  createStripeConnectedAccount,
  createStripeAccountLink,
} from '@/lib/stripe/actions'
import { toast } from 'sonner'

export default function StripeConnectClient() {
  const [connectingStripe, setConnectingStripe] = useState(false)
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

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      // Step 1: Create or get Stripe Connected Account
      const accountResult = await createStripeConnectedAccount()

      if (!accountResult.success) {
        toast.error(accountResult.message || 'Failed to create Stripe account')
        return
      }

      if (!accountResult.accountId) {
        toast.error('No account ID returned')
        return
      }

      // Step 2: Create account link for onboarding
      const linkResult = await createStripeAccountLink(accountResult.accountId)

      if (!linkResult.success) {
        toast.error(linkResult.message || 'Failed to create onboarding link')
        return
      }

      if (!linkResult.url) {
        toast.error('No onboarding URL returned')
        return
      }

      // Step 3: Redirect to Stripe onboarding
      toast.success('Redirecting to Stripe for account setup...')
      window.location.href = linkResult.url
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setConnectingStripe(false)
    }
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
        disabled={connectingStripe}
        size='lg'
        className='w-full'
      >
        {connectingStripe ? (
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

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react'
import {
  createStripeConnectedAccount,
  createStripeAccountLink,
} from '@/lib/stripe/actions'
import { getStripeAccountStatus } from '@/app/dashboard/user-payouts/actions'
import { toast } from 'sonner'

interface StripeAccountData {
  connected: boolean
  account_status: string
  can_receive_payouts: boolean
  requirements_message: string
}

export default function WasherPayoutsPage() {
  const [stripeAccount, setStripeAccount] = useState<StripeAccountData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
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

    fetchStripeStatus()
  }, [])

  const fetchStripeStatus = async () => {
    setLoading(true)
    try {
      const result = await getStripeAccountStatus()
      if (result.success) {
        setStripeAccount(result.data as StripeAccountData)
      } else {
        // Fallback: assume not connected
        setStripeAccount({
          connected: false,
          account_status: 'not_connected',
          can_receive_payouts: false,
          requirements_message: result.message || 'Account not connected',
        })
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
      // Fallback: assume not connected
      setStripeAccount({
        connected: false,
        account_status: 'not_connected',
        can_receive_payouts: false,
        requirements_message: 'Failed to load account status',
      })
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='h-8 w-48 animate-pulse rounded bg-gray-200' />
        <div className='h-64 animate-pulse rounded-lg bg-gray-200' />
      </div>
    )
  }

  const isStripeConnected = stripeAccount?.connected
  const canReceivePayouts = stripeAccount?.can_receive_payouts

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Payouts</h1>
        <p className='mt-2 text-gray-600'>
          Connect your bank account to receive payments for completed bookings
        </p>
      </div>

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

      {/* Main Content */}
      {!isStripeConnected ? (
        // Not connected - Show connection UI
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              Connect with Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='flex items-start gap-3'>
                <Shield className='mt-0.5 h-5 w-5 text-blue-600' />
                <div>
                  <h3 className='font-medium text-blue-900'>
                    Why connect with Stripe?
                  </h3>
                  <p className='mt-1 text-sm text-blue-700'>
                    Connect with Stripe to receive payments for your completed
                    bookings. Stripe is a secure, industry-standard payment
                    processor used by millions of businesses worldwide.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                Bank-level security and encryption
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                Fast and secure money transfers
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                Real-time payment tracking
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                Direct deposit to your bank account
              </div>
            </div>

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
          </CardContent>
        </Card>
      ) : (
        // Connected - Show status and management UI
        <div className='space-y-6'>
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='h-6 w-6 text-green-600' />
                <div>
                  <h3 className='font-medium text-green-900'>
                    Account Connected
                  </h3>
                  <p className='text-sm text-green-700'>
                    Your account is connected and ready to receive payouts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Connection Status</span>
                <Badge variant={canReceivePayouts ? 'default' : 'secondary'}>
                  {canReceivePayouts ? 'Active' : 'Pending Verification'}
                </Badge>
              </div>

              {!canReceivePayouts && (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    {stripeAccount?.requirements_message ||
                      'Your account is being verified. This usually takes 1-2 business days.'}
                  </AlertDescription>
                </Alert>
              )}

              <Button variant='outline' className='w-full'>
                <ExternalLink className='mr-2 h-4 w-4' />
                Manage Payouts
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

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
  DollarSign,
  Clock,
  Shield,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  createStripeConnectedAccount,
  createStripeAccountLink,
} from '@/lib/stripe/actions'
import { toast } from 'sonner'

interface ProfileData {
  stripe_account_id: string | null
  stripe_account_status: string | null
  email: string
  full_name: string | null
}

export default function PayoutsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectSuccess, setConnectSuccess] = useState(false)

  useEffect(() => {
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('connect_success') === 'true') {
      setConnectSuccess(true)
      toast.success('Stripe account connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/payouts')
    }

    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_account_status, email, full_name')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile data')
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setConnecting(true)

    try {
      // Step 1: Create or get Stripe Connect account
      const accountResult = await createStripeConnectedAccount()

      if (!accountResult.success || !accountResult.accountId) {
        toast.error(accountResult.message || 'Failed to create account')
        return
      }

      // Step 2: Create account link for onboarding
      const linkResult = await createStripeAccountLink(accountResult.accountId)

      if (!linkResult.success || !linkResult.url) {
        toast.error(linkResult.message || 'Failed to create onboarding link')
        return
      }

      // Step 3: Redirect to Stripe onboarding
      window.location.href = linkResult.url
    } catch (error) {
      console.error('Error connecting to Stripe:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setConnecting(false)
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

  const isConnected = profile?.stripe_account_id !== null

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Payouts</h1>
        <p className='mt-2 text-gray-600'>
          Manage your payment settings and receive payouts for completed
          bookings
        </p>
      </div>

      {/* Success Alert */}
      {connectSuccess && (
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            Your Stripe account has been successfully connected! You can now
            receive payouts for completed bookings.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Stripe Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-500' />
                <span className='text-sm text-gray-600'>Not Connected</span>
                <Badge
                  variant='outline'
                  className='border-orange-200 text-orange-700'
                >
                  Action Required
                </Badge>
              </div>

              <div className='rounded-lg bg-blue-50 p-4'>
                <h3 className='font-medium text-blue-900'>
                  Connect with Stripe to receive payments
                </h3>
                <p className='mt-2 text-sm text-blue-700'>
                  To receive payouts for your completed bookings, you need to
                  connect your bank account through Stripe. This process is
                  secure and only takes a few minutes.
                </p>
                <ul className='mt-3 space-y-1 text-sm text-blue-700'>
                  <li className='flex items-center gap-2'>
                    <Shield className='h-3 w-3' />
                    Bank-level security and encryption
                  </li>
                  <li className='flex items-center gap-2'>
                    <Clock className='h-3 w-3' />
                    Setup takes less than 5 minutes
                  </li>
                  <li className='flex items-center gap-2'>
                    <DollarSign className='h-3 w-3' />
                    Get paid for completed bookings
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                className='w-full sm:w-auto'
                size='lg'
              >
                {connecting ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className='mr-2 h-4 w-4' />
                    Connect with Stripe
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-500' />
                <span className='text-sm text-gray-600'>Connected</span>
                <Badge
                  variant='default'
                  className='bg-green-100 text-green-800'
                >
                  Active
                </Badge>
              </div>

              <div className='rounded-lg bg-green-50 p-4'>
                <h3 className='font-medium text-green-900'>
                  Your account is connected and ready!
                </h3>
                <p className='mt-2 text-sm text-green-700'>
                  You can now receive payouts for your completed bookings.
                  Payments are typically processed within 2-7 business days
                  after a booking is marked as completed.
                </p>
              </div>

              <div className='flex gap-3'>
                <Button variant='outline' size='sm' className='gap-2'>
                  <ExternalLink className='h-3 w-3' />
                  Manage Payouts
                </Button>
                <Button variant='outline' size='sm' className='gap-2'>
                  <CreditCard className='h-3 w-3' />
                  View Stripe Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* How Payouts Work */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>How Payouts Work</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                1
              </div>
              <div>
                <p className='text-sm font-medium'>Complete a booking</p>
                <p className='text-xs text-gray-600'>
                  Customer confirms service completion
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                2
              </div>
              <div>
                <p className='text-sm font-medium'>Payment processed</p>
                <p className='text-xs text-gray-600'>
                  Funds are transferred to your account
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                3
              </div>
              <div>
                <p className='text-sm font-medium'>Receive payout</p>
                <p className='text-xs text-gray-600'>
                  Money appears in your bank account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Payout Schedule</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Processing time:</span>
              <span className='font-medium'>2-7 business days</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Payout frequency:</span>
              <span className='font-medium'>After each booking</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Platform fee:</span>
              <span className='font-medium'>15% per booking</span>
            </div>
            <div className='mt-4 rounded-lg bg-gray-50 p-3'>
              <p className='text-xs text-gray-600'>
                <strong>Note:</strong> Payouts are automatically processed after
                each completed booking. You'll receive an email confirmation
                when a payout is sent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

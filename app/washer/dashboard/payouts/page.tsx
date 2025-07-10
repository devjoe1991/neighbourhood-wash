import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getStripeAccountStatus } from '@/app/dashboard/user-payouts/actions'
import StripeConnectClient from './StripeConnectClient'

interface StripeAccountData {
  connected: boolean
  account_status: string
  can_receive_payouts: boolean
  requirements_message: string
}

async function fetchStripeStatus(): Promise<{
  data: StripeAccountData | null
  error: string | null
}> {
  try {
    const result = await getStripeAccountStatus()
    if (result.success) {
      return { data: result.data as StripeAccountData, error: null }
    } else {
      // Fallback: assume not connected
      const fallbackData: StripeAccountData = {
        connected: false,
        account_status: 'not_connected',
        can_receive_payouts: false,
        requirements_message: result.message || 'Account not connected',
      }
      return { data: fallbackData, error: null }
    }
  } catch (error) {
    console.error('Error fetching Stripe status:', error)
    // Fallback: assume not connected
    const fallbackData: StripeAccountData = {
      connected: false,
      account_status: 'not_connected',
      can_receive_payouts: false,
      requirements_message: 'Failed to load account status',
    }
    return { data: fallbackData, error: 'Failed to load account status' }
  }
}

export default async function WasherPayoutsPage() {
  // Authentication and authorization checks
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Verify user is a washer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'washer') {
    redirect('/dashboard')
  }

  const { data: stripeAccount } = await fetchStripeStatus()

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

            <StripeConnectClient />
          </CardContent>
        </Card>
      ) : (
        // Connected - Show account status
        <div className='space-y-6'>
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-500' />
                Stripe Account Connected
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <span className='text-sm'>
                  Your Stripe account is connected
                </span>
              </div>

              {canReceivePayouts ? (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <span className='text-sm'>You can receive payouts</span>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    {stripeAccount?.requirements_message ||
                      'Additional information required to receive payouts'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border p-4'>
                  <div className='text-2xl font-bold'>£0.00</div>
                  <div className='text-sm text-gray-600'>Total Earnings</div>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='text-2xl font-bold'>£0.00</div>
                  <div className='text-sm text-gray-600'>This Month</div>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='text-2xl font-bold'>£0.00</div>
                  <div className='text-sm text-gray-600'>Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='py-8 text-center'>
                <p className='text-gray-500'>No transactions yet</p>
                <p className='mt-1 text-sm text-gray-400'>
                  Complete your first booking to see earnings here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

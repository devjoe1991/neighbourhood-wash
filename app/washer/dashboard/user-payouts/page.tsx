'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  PoundSterling,
  Clock,
  Shield,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  getWasherBalance,
  getStripeAccountStatus,
  setupStripeAccount,
} from './actions'
import PayoutRequestForm from '@/components/dashboard/PayoutRequestForm'
import PayoutHistory from '@/components/dashboard/PayoutHistory'
import { toast } from 'sonner'

interface WasherBalance {
  available_balance: number
  processing_balance: number
  total_paid_out: number
  total_earnings: number
  available_bookings_count: number
}

interface StripeAccountData {
  connected: boolean
  account_status: string
  can_receive_payouts: boolean
  requirements_message: string
}

export default function PayoutsPage() {
  const [balance, setBalance] = useState<WasherBalance | null>(null)
  const [stripeAccount, setStripeAccount] = useState<StripeAccountData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [settingUpStripe, setSettingUpStripe] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [setupSuccess, setSetupSuccess] = useState(false)

  useEffect(() => {
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('setup_success') === 'true') {
      setSetupSuccess(true)
      toast.success('Stripe account setup completed successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/user-payouts')
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [balanceResult, stripeResult] = await Promise.all([
        getWasherBalance(),
        getStripeAccountStatus(),
      ])

      if (balanceResult.success) {
        setBalance(balanceResult.data as WasherBalance)
      }

      if (stripeResult.success) {
        setStripeAccount(stripeResult.data as StripeAccountData)
      } else {
        console.error('Error fetching Stripe status:', stripeResult.message)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupStripe = async () => {
    setSettingUpStripe(true)
    try {
      const result = await setupStripeAccount()
      if (result.success) {
        const data = result.data as { onboarding_url: string }
        window.location.href = data.onboarding_url
      } else {
        toast.error(result.message || 'Failed to set up Stripe account')
      }
    } catch (error) {
      console.error('Error setting up Stripe:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSettingUpStripe(false)
    }
  }

  const handlePayoutSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    fetchData()
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='h-8 w-48 animate-pulse rounded bg-gray-200' />
        <div className='grid gap-6 md:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='h-32 animate-pulse rounded-lg bg-gray-200'
            />
          ))}
        </div>
        <div className='h-64 animate-pulse rounded-lg bg-gray-200' />
      </div>
    )
  }

  const isStripeConnected = stripeAccount?.connected
  const canReceivePayouts = stripeAccount?.can_receive_payouts
  const accountStatus = stripeAccount?.account_status || 'not_connected'

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Payouts</h1>
        <p className='mt-2 text-gray-600'>
          Manage your earnings and request payouts securely through our platform
        </p>
      </div>

      {/* Success Alert */}
      {setupSuccess && (
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            Your payment account has been successfully set up! Your account is
            being verified and you'll be able to request payouts once
            verification is complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Overview Cards */}
      {balance && (
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Available Balance
                  </p>
                  <p className='text-2xl font-bold text-green-600'>
                    {formatCurrency(balance.available_balance)}
                  </p>
                  <p className='mt-1 text-xs text-gray-500'>
                    From {balance.available_bookings_count} completed bookings
                  </p>
                </div>
                <Wallet className='h-8 w-8 text-green-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Processing
                  </p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {formatCurrency(balance.processing_balance)}
                  </p>
                  <p className='mt-1 text-xs text-gray-500'>
                    In pending payout requests
                  </p>
                </div>
                <Clock className='h-8 w-8 text-blue-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Total Earned
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {formatCurrency(balance.total_earnings)}
                  </p>
                  <p className='mt-1 text-xs text-gray-500'>
                    Lifetime earnings
                  </p>
                </div>
                <TrendingUp className='h-8 w-8 text-gray-600' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Setup/Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Payment Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isStripeConnected ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-500' />
                <span className='text-sm text-gray-600'>Not Connected</span>
                <Badge
                  variant='outline'
                  className='border-orange-200 text-orange-700'
                >
                  Setup Required
                </Badge>
              </div>

              <div className='rounded-lg bg-blue-50 p-4'>
                <h3 className='font-medium text-blue-900'>
                  Set up your payment account to receive payouts
                </h3>
                <p className='mt-2 text-sm text-blue-700'>
                  To receive payouts for your completed bookings, you need to
                  connect your bank account securely. This process is protected
                  by bank-level security.
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
                    <PoundSterling className='h-3 w-3' />
                    Secure payout requests managed by our team
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleSetupStripe}
                disabled={settingUpStripe}
                className='w-full sm:w-auto'
                size='lg'
              >
                {settingUpStripe ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CreditCard className='mr-2 h-4 w-4' />
                    Set Up Payment Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                {canReceivePayouts ? (
                  <>
                    <CheckCircle className='h-5 w-5 text-green-500' />
                    <span className='text-sm text-gray-600'>
                      Connected & Verified
                    </span>
                    <Badge className='bg-green-100 text-green-800'>
                      Active
                    </Badge>
                  </>
                ) : (
                  <>
                    <Clock className='h-5 w-5 text-yellow-500' />
                    <span className='text-sm text-gray-600'>Connected</span>
                    <Badge
                      variant='outline'
                      className='border-yellow-200 text-yellow-700'
                    >
                      {accountStatus === 'pending_verification'
                        ? 'Pending Verification'
                        : 'Incomplete'}
                    </Badge>
                  </>
                )}
              </div>

              <div
                className={`rounded-lg p-4 ${canReceivePayouts ? 'bg-green-50' : 'bg-yellow-50'}`}
              >
                <h3
                  className={`font-medium ${canReceivePayouts ? 'text-green-900' : 'text-yellow-900'}`}
                >
                  {canReceivePayouts
                    ? 'Your account is ready for payouts!'
                    : 'Account verification in progress'}
                </h3>
                <p
                  className={`mt-2 text-sm ${canReceivePayouts ? 'text-green-700' : 'text-yellow-700'}`}
                >
                  {stripeAccount?.requirements_message}
                </p>
              </div>

              {!canReceivePayouts && (
                <Button
                  onClick={handleSetupStripe}
                  variant='outline'
                  disabled={settingUpStripe}
                  className='gap-2'
                >
                  <ExternalLink className='h-4 w-4' />
                  Complete Setup
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Form - Only show if can receive payouts and has balance */}
      {canReceivePayouts && balance && balance.available_balance > 0 && (
        <PayoutRequestForm
          availableBalance={balance.available_balance}
          minimumPayout={10}
          withdrawalFee={2.5}
          onSuccess={handlePayoutSuccess}
        />
      )}

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
                <p className='text-sm font-medium'>Complete bookings</p>
                <p className='text-xs text-gray-600'>
                  Earnings automatically added to your balance
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                2
              </div>
              <div>
                <p className='text-sm font-medium'>Request payout</p>
                <p className='text-xs text-gray-600'>
                  Submit withdrawal request through this page
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                3
              </div>
              <div>
                <p className='text-sm font-medium'>Admin approval</p>
                <p className='text-xs text-gray-600'>
                  Our team reviews and processes your request
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                4
              </div>
              <div>
                <p className='text-sm font-medium'>Receive payment</p>
                <p className='text-xs text-gray-600'>
                  Funds transferred to your bank account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Payout Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Processing time:</span>
              <span className='font-medium'>2-3 business days</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Minimum withdrawal:</span>
              <span className='font-medium'>£10.00</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Withdrawal fee:</span>
              <span className='font-medium'>£2.50 per request</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Platform commission:</span>
              <span className='font-medium'>15% per booking</span>
            </div>
            <Separator />
            <div className='rounded-lg bg-gray-50 p-3'>
              <p className='text-xs text-gray-600'>
                <strong>Security:</strong> All payout requests are manually
                reviewed by our team for security. The withdrawal fee covers
                payment processing costs and fraud prevention measures.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <PayoutHistory refreshTrigger={refreshTrigger} />
    </div>
  )
}

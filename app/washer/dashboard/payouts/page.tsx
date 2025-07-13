'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Wallet,
  Gift,
} from 'lucide-react'
import {
  getWasherBalance,
  getWasherStripeAccountStatus,
  isEligibleForFreePayout,
} from './actions'
import PayoutRequestForm from '@/components/dashboard/PayoutRequestForm'
import PayoutHistory from '@/components/dashboard/PayoutHistory'
import { toast } from 'sonner'
import StripeConnectClient from './StripeConnectClient'

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
  const [isEligible, setIsEligible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('connect_success') === 'true') {
      toast.success('Stripe account connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/washer/dashboard/payouts')
    }

    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [balanceResult, stripeResult, eligibilityResult] =
        await Promise.all([
          getWasherBalance(),
          getWasherStripeAccountStatus(),
          isEligibleForFreePayout(),
        ])

      if (balanceResult.success) {
        setBalance(balanceResult.data as WasherBalance)
      } else {
        toast.error(balanceResult.message || 'Failed to load balance')
      }

      if (stripeResult.success) {
        setStripeAccount(stripeResult.data as StripeAccountData)
      } else {
        toast.error(stripeResult.message || 'Failed to load Stripe status')
      }

      if (eligibilityResult.eligible) {
        setIsEligible(true)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handlePayoutSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Payouts</h1>
        <p className='mt-2 text-gray-600'>
          Manage your earnings and request payouts securely through our platform
        </p>
      </div>

      {/* Promotional Alert */}
      {isEligible && (
        <Alert className='border-green-500 bg-green-50 text-green-900'>
          <Gift className='h-5 w-5' />
          <AlertDescription className='font-semibold'>
            Welcome aboard! As a new washer, the £2.50 fee on your first payout
            is completely waived.
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

      {/* Main Content Area */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Column - Payout Request & History */}
        <div className='space-y-6 lg:col-span-2'>
          {isStripeConnected && canReceivePayouts ? (
            <PayoutRequestForm
              availableBalance={balance?.available_balance || 0}
              minimumPayout={10.0}
              withdrawalFee={isEligible ? 0 : 2.5}
              onPayoutSuccess={handlePayoutSuccess}
              isFirstPayout={isEligible}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Your Stripe account must be connected and verified before
                    you can request a payout. Please complete the steps in the
                    "Payment Account Status" section.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          <PayoutHistory key={refreshTrigger} />
        </div>

        {/* Right Column - Account Status */}
        <div className='space-y-6 lg:col-span-1'>
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
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      Connect your bank account via Stripe to receive payouts.
                    </AlertDescription>
                  </Alert>
                  <StripeConnectClient />
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-5 w-5 text-green-500' />
                    <span className='text-sm font-medium text-gray-700'>
                      Account Connected
                    </span>
                  </div>
                  <Separator />
                  {canReceivePayouts ? (
                    <Alert className='border-green-200 bg-green-50 text-green-800'>
                      <CheckCircle className='h-4 w-4' />
                      <AlertDescription>
                        Your account is verified and ready to receive payouts.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant='destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        {stripeAccount?.requirements_message ||
                          'Additional information required to receive payouts.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Package,
  Plus,
  Settings,
  CreditCard,
  Handshake,
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { VerificationCallbackHandler } from '@/components/washer/VerificationCallbackHandler'
// import { WasherVerificationContainer } from '@/components/washer/WasherVerificationContainer'
import { VerificationStatusBanner } from '@/components/washer/VerificationStatusBanner'
import { WasherOnboardingContainer } from '@/components/washer/WasherOnboardingContainer'
import {
  canAccessWasherFeatures,
  type StripeAccountStatus,
} from '@/lib/stripe/actions'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Error boundary component for verification failures
function VerificationErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry?: () => void
}) {
  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to Your Washer Dashboard
          </h1>
          <p className='text-muted-foreground'>
            There was an issue checking your verification status.
          </p>
        </div>
      </div>

      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Verification Status Error</AlertTitle>
        <AlertDescription className='space-y-2'>
          <p>{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant='outline' size='sm'>
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Component for unverified washers showing dashboard with integrated onboarding experience
function UnverifiedWasherView({
  user,
}: {
  user: { email?: string; id?: string }
}) {
  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to Your Washer Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Complete your 4-step setup to unlock all features and start earning.
          </p>
        </div>
      </div>

      {/* Prominent Complete Your Setup Section */}
      <div className='rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
        <div className='mb-4 flex items-center space-x-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
            <Settings className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Complete Your Setup
            </h2>
            <p className='text-sm text-gray-600'>
              Follow these 4 steps to unlock your full washer dashboard
            </p>
          </div>
        </div>

        {/* Integrated Onboarding Flow */}
        <WasherOnboardingContainer
          user={user.id ? { ...user, id: user.id } : null}
        />
      </div>

      {/* Dashboard Preview - All Features Locked/Disabled */}
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Your Dashboard Features</h2>
          <div className='flex items-center space-x-2'>
            <AlertCircle className='h-4 w-4 text-orange-500' />
            <p className='text-sm font-medium text-orange-600'>
              Locked until setup complete
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {/* Available Bookings Card - Locked */}
          <Card className='relative flex flex-col border-2 border-dashed border-gray-300 bg-gray-50/50'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                Locked
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200'>
                  <Plus className='h-6 w-6 text-gray-400' />
                </div>
                <div>
                  <CardTitle className='text-gray-500'>
                    Available Bookings
                  </CardTitle>
                  <CardDescription className='text-gray-400'>
                    Browse and accept new bookings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-gray-400'>
                View and accept bookings from customers in your area. Start
                earning immediately after setup!
              </p>
              <div className='mt-3 space-y-1'>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Real-time booking notifications
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Flexible acceptance options
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Competitive pricing
                </div>
              </div>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button
                disabled
                className='w-full cursor-not-allowed bg-gray-200 text-gray-400'
              >
                <Clock className='mr-2 h-4 w-4' />
                Complete Setup to Unlock
              </Button>
            </div>
          </Card>

          {/* My Bookings Card - Locked */}
          <Card className='relative flex flex-col border-2 border-dashed border-gray-300 bg-gray-50/50'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                Locked
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200'>
                  <Package className='h-6 w-6 text-gray-400' />
                </div>
                <div>
                  <CardTitle className='text-gray-500'>My Bookings</CardTitle>
                  <CardDescription className='text-gray-400'>
                    Manage your assigned bookings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-gray-400'>
                Track and manage your accepted bookings from pickup to delivery.
              </p>
              <div className='mt-3 space-y-1'>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Status tracking system
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Customer communication
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Delivery management
                </div>
              </div>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button
                disabled
                className='w-full cursor-not-allowed bg-gray-200 text-gray-400'
              >
                <Clock className='mr-2 h-4 w-4' />
                Complete Setup to Unlock
              </Button>
            </div>
          </Card>

          {/* Payouts Card - Locked */}
          <Card className='relative flex flex-col border-2 border-dashed border-gray-300 bg-gray-50/50'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                Locked
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200'>
                  <CreditCard className='h-6 w-6 text-gray-400' />
                </div>
                <div>
                  <CardTitle className='text-gray-500'>
                    Payouts & Earnings
                  </CardTitle>
                  <CardDescription className='text-gray-400'>
                    Manage your earnings and payouts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-gray-400'>
                View earnings history, request payouts, and manage payment
                methods.
              </p>
              <div className='mt-3 space-y-1'>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Instant payout requests
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Earnings analytics
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Tax documentation
                </div>
              </div>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button
                disabled
                className='w-full cursor-not-allowed bg-gray-200 text-gray-400'
              >
                <Clock className='mr-2 h-4 w-4' />
                Complete Setup to Unlock
              </Button>
            </div>
          </Card>

          {/* Referrals Card - Locked */}
          <Card className='relative flex flex-col border-2 border-dashed border-gray-300 bg-gray-50/50'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                Locked
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200'>
                  <Handshake className='h-6 w-6 text-gray-400' />
                </div>
                <div>
                  <CardTitle className='text-gray-500'>Referrals</CardTitle>
                  <CardDescription className='text-gray-400'>
                    Earn more by referring others
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-gray-400'>
                Refer new washers and customers to earn bonus rewards.
              </p>
              <div className='mt-3 space-y-1'>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Referral tracking
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Bonus rewards
                </div>
                <div className='flex items-center text-xs text-gray-400'>
                  <CheckCircle className='mr-2 h-3 w-3' />
                  Network growth
                </div>
              </div>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button
                disabled
                className='w-full cursor-not-allowed bg-gray-200 text-gray-400'
              >
                <Clock className='mr-2 h-4 w-4' />
                Complete Setup to Unlock
              </Button>
            </div>
          </Card>

          {/* Settings Card - Available during onboarding */}
          <Card className='relative flex flex-col border-2 border-green-200 bg-green-50/30'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
                Available
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100'>
                  <Settings className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <CardTitle className='text-green-800'>
                    Washer Settings
                  </CardTitle>
                  <CardDescription className='text-green-700'>
                    Configure your services and availability
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-green-700'>
                Set your service areas, availability, and preferences while
                completing setup.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button
                asChild
                className='w-full bg-green-600 hover:bg-green-700'
              >
                <Link href='/washer/dashboard/my-settings'>
                  <Settings className='mr-2 h-4 w-4' />
                  Configure Settings
                </Link>
              </Button>
            </div>
          </Card>

          {/* How It Works Card - Available */}
          <Card className='relative flex flex-col border-2 border-blue-200 bg-blue-50/30'>
            <div className='absolute top-3 right-3'>
              <div className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                Available
              </div>
            </div>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                  <HelpCircle className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <CardTitle className='text-blue-800'>Washer Guide</CardTitle>
                  <CardDescription className='text-blue-700'>
                    Learn how to excel as a washer
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p className='text-sm text-blue-700'>
                Get tips on providing excellent service, managing bookings, and
                maximizing earnings.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full bg-blue-600 hover:bg-blue-700'>
                <Link href='/how-it-works'>
                  <HelpCircle className='mr-2 h-4 w-4' />
                  View Guide
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* What You'll Unlock Section */}
      <div className='rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6'>
        <h3 className='mb-3 text-lg font-semibold text-green-900'>
          What you'll unlock after completing setup:
        </h3>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div>
              <p className='font-medium text-green-800'>Accept Bookings</p>
              <p className='text-sm text-green-700'>
                Start earning from day one with immediate booking access
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div>
              <p className='font-medium text-green-800'>Instant Payouts</p>
              <p className='text-sm text-green-700'>
                Request payouts anytime with fast processing
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div>
              <p className='font-medium text-green-800'>
                Full Dashboard Access
              </p>
              <p className='text-sm text-green-700'>
                Access all features including analytics and reporting
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
            <div>
              <p className='font-medium text-green-800'>Referral Rewards</p>
              <p className='text-sm text-green-700'>
                Earn bonus income by referring other washers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='text-muted-foreground text-center text-sm'>
        <p>
          Signed in as {user.email}.
          <br />
          Complete your 4-step setup above to unlock all washer features and
          start earning.
        </p>
      </div>
    </div>
  )
}

// Component for washers with verification in progress
function VerificationInProgressView({
  status,
  accountId,
  requirements,
}: {
  status: StripeAccountStatus
  accountId?: string
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
    disabled_reason?: string
  }
}) {
  const getStatusMessage = (status: StripeAccountStatus) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Verification Under Review',
          description:
            'Your verification documents are being reviewed. This typically takes 1-2 business days.',
          icon: Clock,
          color: 'text-blue-600',
        }
      case 'requires_action':
        return {
          title: 'Action Required',
          description:
            'Additional information is needed to complete your verification.',
          icon: AlertCircle,
          color: 'text-orange-600',
        }
      case 'rejected':
        return {
          title: 'Verification Issues',
          description:
            'There were issues with your verification. Please contact support for assistance.',
          icon: AlertCircle,
          color: 'text-red-600',
        }
      default:
        return {
          title: 'Verification In Progress',
          description: 'Your account verification is being processed.',
          icon: Clock,
          color: 'text-blue-600',
        }
    }
  }

  const statusInfo = getStatusMessage(status)
  const StatusIcon = statusInfo.icon

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to Your Washer Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Your account is being verified.
          </p>
        </div>
      </div>

      {/* Verification Status Banner */}
      <VerificationStatusBanner
        status={status}
        accountId={accountId}
        requirements={requirements}
      />

      {/* Status Information Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-3'>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100`}
            >
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
            </div>
            <div>
              <CardTitle>{statusInfo.title}</CardTitle>
              <CardDescription>{statusInfo.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <p className='text-gray-600'>
              Once verification is complete, you'll have access to all washer
              features including:
            </p>
            <ul className='ml-4 list-inside list-disc space-y-1 text-gray-600'>
              <li>View and accept available bookings</li>
              <li>Manage your current bookings</li>
              <li>Access payout information and request payouts</li>
              <li>Update your washer settings and preferences</li>
            </ul>

            {status === 'rejected' && (
              <div className='mt-4 rounded-lg bg-red-50 p-4'>
                <p className='font-medium text-red-800'>Need Help?</p>
                <p className='mt-1 text-sm text-red-700'>
                  If you're having trouble with verification, please{' '}
                  <a
                    href='mailto:support@example.com'
                    className='underline hover:no-underline'
                  >
                    contact our support team
                  </a>{' '}
                  for assistance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Features - Locked during verification */}
      {status !== 'rejected' && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>Your Dashboard Features</h2>
            <div className='flex items-center space-x-2'>
              <Clock className='h-4 w-4 text-blue-500' />
              <p className='text-sm font-medium text-blue-600'>
                Pending verification completion
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {/* Available Bookings Card - Locked */}
            <Card className='relative flex flex-col border-2 border-dashed border-blue-300 bg-blue-50/30'>
              <div className='absolute top-3 right-3'>
                <div className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                  Pending
                </div>
              </div>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200'>
                    <Plus className='h-6 w-6 text-blue-500' />
                  </div>
                  <div>
                    <CardTitle className='text-blue-700'>
                      Available Bookings
                    </CardTitle>
                    <CardDescription className='text-blue-600'>
                      Browse and accept new bookings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-blue-600'>
                  Available once verification is complete. Start earning
                  immediately!
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button
                  disabled
                  className='w-full cursor-not-allowed bg-blue-200 text-blue-500'
                >
                  <Clock className='mr-2 h-4 w-4' />
                  Awaiting Verification
                </Button>
              </div>
            </Card>

            {/* My Bookings Card - Locked */}
            <Card className='relative flex flex-col border-2 border-dashed border-blue-300 bg-blue-50/30'>
              <div className='absolute top-3 right-3'>
                <div className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                  Pending
                </div>
              </div>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200'>
                    <Package className='h-6 w-6 text-blue-500' />
                  </div>
                  <div>
                    <CardTitle className='text-blue-700'>My Bookings</CardTitle>
                    <CardDescription className='text-blue-600'>
                      Manage your assigned bookings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-blue-600'>
                  Track and manage bookings once verification is complete.
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button
                  disabled
                  className='w-full cursor-not-allowed bg-blue-200 text-blue-500'
                >
                  <Clock className='mr-2 h-4 w-4' />
                  Awaiting Verification
                </Button>
              </div>
            </Card>

            {/* Payouts Card - Locked */}
            <Card className='relative flex flex-col border-2 border-dashed border-blue-300 bg-blue-50/30'>
              <div className='absolute top-3 right-3'>
                <div className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                  Pending
                </div>
              </div>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200'>
                    <CreditCard className='h-6 w-6 text-blue-500' />
                  </div>
                  <div>
                    <CardTitle className='text-blue-700'>
                      Payouts & Earnings
                    </CardTitle>
                    <CardDescription className='text-blue-600'>
                      Manage your earnings and payouts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-blue-600'>
                  Access earnings and payout features once verified.
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button
                  disabled
                  className='w-full cursor-not-allowed bg-blue-200 text-blue-500'
                >
                  <Clock className='mr-2 h-4 w-4' />
                  Awaiting Verification
                </Button>
              </div>
            </Card>

            {/* Settings Card - Available during verification */}
            <Card className='relative flex flex-col border-2 border-green-200 bg-green-50/30'>
              <div className='absolute top-3 right-3'>
                <div className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
                  Available
                </div>
              </div>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100'>
                    <Settings className='h-6 w-6 text-green-600' />
                  </div>
                  <div>
                    <CardTitle className='text-green-800'>
                      Washer Settings
                    </CardTitle>
                    <CardDescription className='text-green-700'>
                      Configure your services and availability
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-green-700'>
                  Set your service areas and preferences while verification is
                  processed.
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button
                  asChild
                  className='w-full bg-green-600 hover:bg-green-700'
                >
                  <Link href='/washer/dashboard/my-settings'>
                    <Settings className='mr-2 h-4 w-4' />
                    Configure Settings
                  </Link>
                </Button>
              </div>
            </Card>

            {/* How It Works Card - Available during verification */}
            <Card className='relative flex flex-col border-2 border-blue-200 bg-blue-50/30'>
              <div className='absolute top-3 right-3'>
                <div className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                  Available
                </div>
              </div>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                    <HelpCircle className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <CardTitle className='text-blue-800'>
                      Washer Guide
                    </CardTitle>
                    <CardDescription className='text-blue-700'>
                      Learn how to excel as a washer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-blue-700'>
                  Get tips on providing excellent service and maximizing
                  earnings.
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button
                  asChild
                  className='w-full bg-blue-600 hover:bg-blue-700'
                >
                  <Link href='/how-it-works'>
                    <HelpCircle className='mr-2 h-4 w-4' />
                    View Guide
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for verified washers showing full dashboard
function VerifiedWasherView({ user }: { user: { email?: string } }) {
  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to Your Washer Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Manage your bookings, earnings, and settings from here.
          </p>
        </div>
      </div>

      {/* Exciting Welcome Message */}
      <div className='rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6 text-center shadow-sm'>
        <h2 className='text-2xl font-bold text-green-800'>
          Welcome to the washer hub!
        </h2>
        <p className='text-muted-foreground mt-2'>
          Start earning by accepting bookings and providing excellent service.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* Available Bookings Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Plus className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Available Bookings</CardTitle>
                <CardDescription>
                  Browse and accept new bookings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              View and accept bookings from customers in your area. Get started
              earning today!
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full'>
              <Link href='/washer/dashboard/available-bookings'>
                View Available Bookings
              </Link>
            </Button>
          </div>
        </Card>

        {/* My Bookings Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Package className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Manage your assigned bookings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              View your accepted bookings, track their status, and manage the
              pickup and delivery process.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full'>
              <Link href='/washer/dashboard/bookings'>View My Bookings</Link>
            </Button>
          </div>
        </Card>

        {/* Payouts Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <CreditCard className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Payouts</CardTitle>
                <CardDescription>
                  Manage your earnings and payouts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              View your earnings history, request payouts, and manage your
              payment methods.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full'>
              <Link href='/washer/dashboard/payouts'>View Payouts</Link>
            </Button>
          </div>
        </Card>

        {/* Referrals Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Handshake className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Referrals</CardTitle>
                <CardDescription>Earn more by referring others</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              Refer new washers and customers to earn bonus rewards and grow
              your network.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full' variant='secondary'>
              <Link href='/user/dashboard/referrals'>View Referrals</Link>
            </Button>
          </div>
        </Card>

        {/* Settings Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Settings className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Washer Settings</CardTitle>
                <CardDescription>
                  Configure your services and availability
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              Set your service areas, availability, pricing, and other
              preferences.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full' variant='secondary'>
              <Link href='/user/dashboard/settings'>Go to Settings</Link>
            </Button>
          </div>
        </Card>

        {/* How It Works Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <HelpCircle className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Washer Guide</CardTitle>
                <CardDescription>
                  Learn how to excel as a washer
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              Get tips on providing excellent service, managing bookings, and
              maximizing your earnings.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full' variant='secondary'>
              <Link href='/how-it-works'>View Guide</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className='text-muted-foreground text-center text-sm'>
        <p>
          Signed in as {user.email}.
          <br />
          Please note we are in a Beta (Soft Launch) phase.
        </p>
      </div>
    </div>
  )
}

export default async function WasherDashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view the dashboard.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status, stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .maybeSingle()

  // Handle profile fetch errors
  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return (
      <VerificationErrorState error='Failed to load your profile. Please try refreshing the page.' />
    )
  }

  if (!profile) {
    return redirect('/user/dashboard?message=Profile not found.')
  }

  const userRole = profile.role || user.user_metadata?.selected_role
  const washerStatus = profile.washer_status

  // Debug logging
  console.log('Washer Dashboard Debug:', {
    userId: user.id,
    userEmail: user.email,
    profileRole: profile.role,
    metadataRole: user.user_metadata?.selected_role,
    finalRole: userRole,
    washerStatus: washerStatus,
    stripeAccountId: profile.stripe_account_id,
    stripeAccountStatus: profile.stripe_account_status,
  })

  // Redirect if not a washer
  if (userRole !== 'washer') {
    console.log(`Redirecting user ${user.id} - not a washer. Role: ${userRole}`)
    return redirect(
      '/user/dashboard?message=Access denied. Washer role required.'
    )
  }

  // For washers who haven't been approved yet, show the KYC onboarding flow
  // Only redirect if they're explicitly rejected
  if (washerStatus === 'rejected') {
    console.log(`Redirecting user ${user.id} - washer application rejected`)
    return redirect(
      '/user/dashboard?message=Your washer application has been rejected. Please contact support.'
    )
  }

  // CRITICAL FIX: Always check onboarding status first for new washers
  // If user has no Stripe account, they definitely need onboarding
  if (!profile.stripe_account_id) {
    console.log(
      `[WASHER_DASHBOARD] User ${user.id} has no Stripe account - showing onboarding`
    )
    return <UnverifiedWasherView user={user} />
  }

  // If user hasn't paid onboarding fee, they need onboarding
  if (!profile.onboarding_fee_paid) {
    console.log(
      `[WASHER_DASHBOARD] User ${user.id} hasn't paid onboarding fee - showing onboarding`
    )
    return <UnverifiedWasherView user={user} />
  }

  // Check verification status with comprehensive error handling
  let verificationResult
  let verificationError: string | null = null

  try {
    verificationResult = await canAccessWasherFeatures(user.id)
  } catch (error) {
    console.error('Error checking washer verification status:', error)
    verificationError = 'Failed to check verification status. Please try again.'
  }

  // Handle verification check failures - but be more graceful for common cases
  if (verificationError) {
    return <VerificationErrorState error={verificationError} />
  }

  // If the verification result failed, default to showing onboarding for safety
  if (!verificationResult?.success) {
    const error = verificationResult?.error

    console.log(
      `[WASHER_DASHBOARD] Verification check failed for user ${user.id}, defaulting to onboarding. Error:`,
      error
    )
    return <UnverifiedWasherView user={user} />
  }

  const { canAccess, status, accountId, requirements } =
    verificationResult.data || {
      canAccess: false,
      status: 'incomplete' as StripeAccountStatus,
      accountId: undefined,
      requirements: undefined,
    }

  // CRITICAL: If canAccess is false, always show onboarding
  if (!canAccess) {
    console.log(
      `[WASHER_DASHBOARD] User ${user.id} cannot access features - showing onboarding`
    )
    return <UnverifiedWasherView user={user} />
  }

  return (
    <>
      {/* Handle verification callback */}
      <Suspense fallback={null}>
        <VerificationCallbackHandler />
      </Suspense>

      {/* Render appropriate view based on verification status */}
      {(() => {
        // CRITICAL: Only show full dashboard if ALL conditions are met
        if (
          canAccess &&
          status === 'complete' &&
          profile.stripe_account_id &&
          profile.onboarding_fee_paid
        ) {
          console.log(
            `[WASHER_DASHBOARD] Showing full dashboard for verified user ${user.id}`
          )
          return <VerifiedWasherView user={user} />
        }

        // For washers with verification in progress but have Stripe account
        if (
          profile.stripe_account_id &&
          status !== 'incomplete' &&
          status !== 'complete'
        ) {
          console.log(
            `[WASHER_DASHBOARD] Showing verification in progress for user ${user.id}`
          )
          return (
            <VerificationInProgressView
              status={status}
              accountId={accountId}
              requirements={requirements}
            />
          )
        }

        // Default to onboarding for all other cases
        console.log(
          `[WASHER_DASHBOARD] Defaulting to onboarding view for user ${user.id}`
        )
        return <UnverifiedWasherView user={user} />
      })()}
    </>
  )
}

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
} from 'lucide-react'
import { VerificationCallbackHandler } from '@/components/washer/VerificationCallbackHandler'
import { WasherVerificationContainer } from '@/components/washer/WasherVerificationContainer'
import { VerificationStatusBanner } from '@/components/washer/VerificationStatusBanner'
import { canAccessWasherFeatures, type StripeAccountStatus } from '@/lib/stripe/actions'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'



// Error boundary component for verification failures
function VerificationErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
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

// Component for unverified washers showing verification container
function UnverifiedWasherView() {
  return <WasherVerificationContainer />
}

// Component for washers with verification in progress
function VerificationInProgressView({ 
  status, 
  accountId, 
  requirements 
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
          description: 'Your verification documents are being reviewed. This typically takes 1-2 business days.',
          icon: Clock,
          color: 'text-blue-600'
        }
      case 'requires_action':
        return {
          title: 'Action Required',
          description: 'Additional information is needed to complete your verification.',
          icon: AlertCircle,
          color: 'text-orange-600'
        }
      case 'rejected':
        return {
          title: 'Verification Issues',
          description: 'There were issues with your verification. Please contact support for assistance.',
          icon: AlertCircle,
          color: 'text-red-600'
        }
      default:
        return {
          title: 'Verification In Progress',
          description: 'Your account verification is being processed.',
          icon: Clock,
          color: 'text-blue-600'
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
            <div className={`bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg`}>
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
              Once verification is complete, you'll have access to all washer features including:
            </p>
            <ul className='list-disc list-inside text-gray-600 space-y-1 ml-4'>
              <li>View and accept available bookings</li>
              <li>Manage your current bookings</li>
              <li>Access payout information and request payouts</li>
              <li>Update your washer settings and preferences</li>
            </ul>
            
            {status === 'rejected' && (
              <div className='mt-4 p-4 bg-red-50 rounded-lg'>
                <p className='text-red-800 font-medium'>Need Help?</p>
                <p className='text-red-700 text-sm mt-1'>
                  If you're having trouble with verification, please{' '}
                  <a href='mailto:support@example.com' className='underline hover:no-underline'>
                    contact our support team
                  </a>{' '}
                  for assistance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Limited functionality cards for non-rejected statuses */}
      {status !== 'rejected' && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Settings Card - Available during verification */}
          <Card className='flex flex-col opacity-100'>
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
                Set your service areas, availability, and other preferences while 
                your verification is being processed.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full' variant='secondary'>
                <Link href='/user/dashboard/settings'>Go to Settings</Link>
              </Button>
            </div>
          </Card>

          {/* How It Works Card - Available during verification */}
          <Card className='flex flex-col opacity-100'>
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
      <VerificationErrorState 
        error="Failed to load your profile. Please try refreshing the page." 
      />
    )
  }

  if (!profile) {
    return redirect('/user/dashboard?message=Profile not found.')
  }

  const userRole = profile.role || user.user_metadata?.selected_role
  const washerStatus = profile.washer_status

  // Redirect if not a washer
  if (userRole !== 'washer') {
    return redirect(
      '/user/dashboard?message=Access denied. Washer role required.'
    )
  }

  // Check if washer is approved
  if (washerStatus !== 'approved') {
    return redirect(
      '/user/dashboard/become-washer?message=Your washer application is not yet approved.'
    )
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

  // Handle verification check failures
  if (verificationError || !verificationResult?.success) {
    const errorMessage = verificationError || 
      verificationResult?.error?.message || 
      'Unknown error occurred while checking verification status.'
    
    return <VerificationErrorState error={errorMessage} />
  }

  const { canAccess, status, accountId, requirements } = verificationResult.data || {
    canAccess: false,
    status: 'incomplete' as StripeAccountStatus,
    accountId: undefined,
    requirements: undefined,
  }

  return (
    <>
      {/* Handle verification callback */}
      <Suspense fallback={null}>
        <VerificationCallbackHandler />
      </Suspense>

      {/* Render appropriate view based on verification status */}
      {(() => {
        // For completely unverified washers (no Stripe account), show full onboarding container
        if (!profile.stripe_account_id || status === 'incomplete') {
          return <UnverifiedWasherView />
        }
        
        // For verified washers, show full dashboard
        if (canAccess && status === 'complete') {
          return <VerifiedWasherView user={user} />
        }
        
        // For washers with verification in progress, show status and limited functionality
        return (
          <VerificationInProgressView 
            status={status}
            accountId={accountId}
            requirements={requirements}
          />
        )
      })()}
    </>
  )
}

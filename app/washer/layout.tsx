import Sidebar from '@/components/dashboard/Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { WasherVerificationContainer } from '@/components/washer/WasherVerificationContainer'
import { VerificationStatusBanner } from '@/components/washer/VerificationStatusBanner'
import { VerificationCallbackHandler } from '@/components/washer/VerificationCallbackHandler'
import { VerificationErrorBoundary } from '@/components/washer/VerificationErrorBoundary'
import { canAccessWasherFeatures, type StripeAccountStatus } from '@/lib/stripe/actions'

export default async function WasherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect(
      '/signin?message=Please sign in to access the washer dashboard.'
    )
  }

  // Verify user is a washer and approved
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status, stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('WASHER LAYOUT PROFILE FETCH ERROR:', profileError)
    // Redirect to a generic error page or show a message
    // For now, redirecting to user dashboard with an error message
    return redirect('/user/dashboard?message=Profile+fetch+error')
  }

  if (profile.role !== 'washer') {
    return redirect(
      '/user/dashboard?message=Access+denied.+Washer+role+required.'
    )
  }

  // Check if washer application is approved
  if (profile.washer_status !== 'approved') {
    return redirect(
      '/user/dashboard/become-washer?message=Your+washer+application+is+not+yet+approved.'
    )
  }

  // Check verification status and access permissions
  let verificationResult
  try {
    verificationResult = await canAccessWasherFeatures(user.id)
  } catch (error) {
    console.error('Error checking washer verification status:', error)
    // Fall back to profile data if API call fails
    const cachedStatus = (profile.stripe_account_status as StripeAccountStatus) || 'incomplete'
    verificationResult = {
      success: true,
      data: {
        canAccess: cachedStatus === 'complete',
        status: cachedStatus,
        accountId: profile.stripe_account_id || undefined,
      }
    }
  }

  if (!verificationResult.success) {
    console.error('Failed to check verification status:', verificationResult.error)
    return redirect('/user/dashboard?message=Verification+status+check+failed')
  }

  const { canAccess, status, accountId, requirements } = verificationResult.data || {
    canAccess: false,
    status: 'incomplete' as StripeAccountStatus,
    accountId: undefined,
    requirements: undefined,
  }

  // If washer cannot access features, show verification container
  if (!canAccess) {
    // For completely unverified washers (no Stripe account), show full onboarding container
    if (!profile.stripe_account_id || status === 'incomplete') {
      return (
        <VerificationErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Verification container error:', error, errorInfo)
          }}
          maxRetries={3}
        >
          <WasherVerificationContainer />
        </VerificationErrorBoundary>
      )
    }
    
    // For washers with verification in progress, show status banner with limited dashboard
    return (
      <>
        {/* Handle verification callback for in-progress verification */}
        <Suspense fallback={null}>
          <VerificationCallbackHandler />
        </Suspense>

        <div className='min-h-screen bg-gray-100'>
          {/* Desktop Sidebar - hidden on mobile */}
          <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
            <Sidebar userRole={profile.role} />
          </div>

          {/* Mobile Header & Main Content */}
          <div className='flex flex-1 flex-col md:pl-64'>
            {/* Mobile-only Header */}
            <header className='sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden'>
              <Link
                href='/washer/dashboard'
                className='text-lg font-bold text-blue-600'
              >
                NW
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <button className='rounded-md p-2 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset'>
                    <Menu className='h-6 w-6' />
                  </button>
                </SheetTrigger>
                <SheetContent side='left' className='w-64 p-0'>
                  <Sidebar userRole={profile.role} isMobile />
                </SheetContent>
              </Sheet>
            </header>

            {/* Main Content with Verification Status */}
            <main className='flex-1 p-4 sm:p-6 lg:p-8'>
              <VerificationStatusBanner
                status={status}
                accountId={accountId}
                requirements={requirements}
              />
              
              {/* Limited dashboard content for verification in progress */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="verification-in-progress-content">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Verification in Progress
                </h2>
                <p className="text-gray-600 mb-4">
                  Your washer account is being verified. Once verification is complete, 
                  you'll have access to all washer features including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>View and accept available bookings</li>
                  <li>Manage your current bookings</li>
                  <li>Access payout information</li>
                  <li>Update your washer settings</li>
                </ul>
              </div>
            </main>
          </div>
        </div>
      </>
    )
  }

  return (
    <VerificationErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Washer layout error:', error, errorInfo)
        // In production, you might want to send this to a logging service
      }}
      maxRetries={2}
    >
      {/* Handle verification callback across all washer pages */}
      <Suspense fallback={null}>
        <VerificationCallbackHandler />
      </Suspense>

      <div className='min-h-screen bg-gray-100'>
        {/* Desktop Sidebar - hidden on mobile */}
        <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
          <Sidebar userRole={profile.role} />
        </div>

        {/* Mobile Header & Main Content */}
        <div className='flex flex-1 flex-col md:pl-64'>
          {/* Mobile-only Header */}
          <header className='sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden'>
            <Link
              href='/washer/dashboard'
              className='text-lg font-bold text-blue-600'
            >
              NW
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <button className='rounded-md p-2 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset'>
                  <Menu className='h-6 w-6' />
                </button>
              </SheetTrigger>
              <SheetContent side='left' className='w-64 p-0'>
                <Sidebar userRole={profile.role} isMobile />
              </SheetContent>
            </Sheet>
          </header>

          {/* Main Content */}
          <main className='flex-1 p-4 sm:p-6 lg:p-8' data-testid="washer-dashboard-content">{children}</main>
        </div>
      </div>
    </VerificationErrorBoundary>
  )
}

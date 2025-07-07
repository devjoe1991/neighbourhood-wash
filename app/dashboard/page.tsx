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
import {
  Rocket,
  User,
  HelpCircle,
  ClipboardList,
  LayoutGrid,
  WashingMachine,
} from 'lucide-react'
import { getCompletedBookingsNeedingReview } from './actions'
import PostBookingPrompt from '@/components/dashboard/PostBookingPrompt'
import WasherActivation from '@/components/dashboard/WasherActivation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view the dashboard.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, washer_status')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || user.user_metadata?.selected_role
  const isWasher = userRole === 'washer'
  const washerStatus = profile?.washer_status

  // Get completed bookings that need review (only for users, not washers)
  const completedBookingsResult = !isWasher
    ? await getCompletedBookingsNeedingReview()
    : { success: true, data: [] }

  const completedBookings = completedBookingsResult.success
    ? completedBookingsResult.data
    : []

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to Your Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Here&apos;s a quick overview of your account and available actions.
          </p>
        </div>
      </div>

      {/* Conditionally render the activation component for washers */}
      {isWasher && <WasherActivation />}

      {userRole && (
        <div className='rounded-md border border-blue-200 bg-blue-50 p-4'>
          <p className='text-sm font-semibold text-blue-800'>
            You are currently viewing the dashboard as a{' '}
            <span className='font-bold capitalize'>{userRole}</span>.
          </p>
        </div>
      )}

      {/* Exciting Welcome Message */}
      <div className='rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center shadow-sm'>
        <h2 className='text-2xl font-bold text-blue-800'>
          Welcome to the laundry revolution!
        </h2>
        <p className='text-muted-foreground mt-2'>
          Thank you for joining early. You are helping to shape the future of
          laundry.
        </p>
      </div>

      {/* Post-Booking Review Prompts */}
      {completedBookings.length > 0 && (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold text-gray-900'>
            How was your recent service?
          </h2>
          <div className='space-y-4'>
            {completedBookings.map((booking) => (
              <PostBookingPrompt key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* Card for Setting Laundry Preferences (for Users) */}
        {!isWasher && (
          <Card className='flex flex-col'>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                  <WashingMachine className='text-primary h-6 w-6' />
                </div>
                <div>
                  <CardTitle>Set Your Laundry Preferences</CardTitle>
                  <CardDescription>
                    Get ready for our full launch!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p>
                Tell us about your allergies and product choices now so
                we&apos;re ready to match you with the perfect Washer.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full'>
                <Link href='/dashboard/laundry-preferences'>
                  Set Preferences
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Card for Becoming a Washer - Now shown as a secondary option for users */}
        {!isWasher && (
          <Card className='flex flex-col'>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                  <Rocket className='text-primary h-6 w-6' />
                </div>
                <div>
                  <CardTitle>Become a Washer</CardTitle>
                  <CardDescription>
                    Start earning from your laundry room.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p>
                Interested in earning? Join our community of trusted locals.
                Start the application process here.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full' variant='secondary'>
                <Link href='/dashboard/become-washer'>
                  {washerStatus
                    ? 'Check Application Status'
                    : 'Start Your Application'}
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Card for Approved Washers */}
        {isWasher && washerStatus === 'approved' && (
          <Card className='flex flex-col'>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10'>
                  <LayoutGrid className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <CardTitle>Washer Hub</CardTitle>
                  <CardDescription>Manage your services</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <p>
                Your application is approved! Head to your hub to set your
                prices, manage your availability, and view your jobs.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full' variant='default'>
                <Link href='/dashboard/washer-hub'>Go to Hub</Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Card for Pending Washers */}
        {isWasher &&
          (washerStatus === 'pending_application' ||
            washerStatus === 'pending_verification') && (
            <Card className='flex flex-col'>
              <CardHeader>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10'>
                    <ClipboardList className='h-6 w-6 text-yellow-600' />
                  </div>
                  <div>
                    <CardTitle>Application Status</CardTitle>
                    <CardDescription>
                      Your application is in progress
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p>
                  Thank you for applying! You can check the current status of
                  your application and see the next steps here.
                </p>
              </CardContent>
              <div className='p-6 pt-0'>
                <Button asChild className='w-full'>
                  <Link href='/dashboard/become-washer'>
                    View Application Status
                  </Link>
                </Button>
              </div>
            </Card>
          )}

        {/* How It Works Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <HelpCircle className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Understand the process from start to finish.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              New to Neighbourhood Wash? Learn how to use our platform, from
              booking a wash to secure PIN verification.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full' variant='secondary'>
              <Link href='/how-it-works'>View Guide</Link>
            </Button>
          </div>
        </Card>

        {/* Account Settings Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <User className='text-primary h-6 w-6' />
              </div>
              <div>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your personal information.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex-grow'>
            <p>
              Update your profile details, manage notification preferences, and
              view your account history.
            </p>
          </CardContent>
          <div className='p-6 pt-0'>
            <Button asChild className='w-full' variant='secondary'>
              <Link href='/dashboard/settings'>Go to Settings</Link>
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

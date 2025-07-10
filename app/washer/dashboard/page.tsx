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
  Package,
  Plus,
  Settings,
  CreditCard,
  Handshake,
  HelpCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WasherDashboardPage() {
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
  const washerStatus = profile?.washer_status

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

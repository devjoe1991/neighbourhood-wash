import { createClient } from '@/utils/supabase/server_new'
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
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

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
    .single()

  const isWasher = profile?.role === 'washer'
  const washerStatus = profile?.washer_status

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

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* Card for Becoming a Washer */}
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
                Join our community of trusted locals. Click here to start the
                application process or check on your status.
              </p>
            </CardContent>
            <div className='p-6 pt-0'>
              <Button asChild className='w-full'>
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

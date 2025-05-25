export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server_new' // Using the server_new client
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions' // Import the server action
// import Sidebar from '@/components/dashboard/Sidebar' // No longer needed here, layout handles it

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser() // This internally uses the (now async) cookie methods

  if (!user) {
    // This should ideally be caught by middleware,
    // but as a safeguard or if middleware is bypassed for any reason.
    return redirect('/signin?message=Please sign in to view the dashboard.')
  }

  let isApprovedWasher = false
  // Fetch profile to check washer_status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('washer_status, role')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('DashboardPage: Error fetching profile:', profileError)
    // Potentially show an error to the user or handle gracefully
  }

  if (profile) {
    isApprovedWasher =
      profile.role === 'WASHER' && profile.washer_status === 'approved'
  }

  let hasRegisteredInterest = false
  // Only check for interest registration if the user is not already an approved washer
  if (user && !isApprovedWasher) {
    const { data: interestData, error: interestRegError } = await supabase
      .from('washer_interest_registrations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle to avoid error if no row found

    if (interestRegError) {
      console.error(
        'DashboardPage: Error fetching interest registration:',
        interestRegError
      )
      // Potentially show an error to the user or handle gracefully
    }
    hasRegisteredInterest = !!interestData
  }

  // The main layout (app/dashboard/layout.tsx) now provides the overall page structure (sidebar, main tag, margins)
  // This component should only return the content specific to the dashboard overview.
  return (
    <div className='rounded-lg bg-white p-8 shadow-md'>
      <h1 className='mb-4 text-3xl font-bold text-blue-600'>
        Welcome to your Dashboard!
      </h1>
      <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4'>
        <h2 className='mb-2 text-xl font-semibold text-blue-700'>
          Welcome to the Laundry Revolution!
        </h2>
        <p className='text-gray-600'>
          Congratulations on joining Neighbourhood Wash! You&apos;re now part of
          an exciting new way to manage laundry and connect with your community.
        </p>
        <p className='mt-2 text-gray-600'>
          Please note: You are currently experiencing our{' '}
          <strong className='text-blue-600'>Beta Version (Soft Launch)</strong>.
          We&apos;re actively working on adding more features and refining the
          experience. We&apos;ll keep you updated as we approach our full
          launch!
        </p>
      </div>

      {/* Conditional section for non-approved washers */}
      {!isApprovedWasher && (
        <>
          {hasRegisteredInterest ? (
            <div className='mb-6 rounded-lg border border-green-300 bg-green-50 p-4'>
              <h2 className='mb-2 text-xl font-semibold text-green-700'>
                Interest Received!
              </h2>
              <p className='text-gray-600'>
                Thank you for registering your interest in becoming a
                Neighbourhood Washer! We have your details and are currently in
                our pre-launch phase. We will be in touch soon regarding the
                next steps for full verification and onboarding as we prepare to
                launch in your area. We appreciate your patience!
              </p>
            </div>
          ) : (
            // Only show this if they haven't registered interest yet
            <div className='mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4'>
              <h2 className='mb-2 text-xl font-semibold text-yellow-700'>
                Interested in Earning with Your Laundry?
              </h2>
              <p className='mb-3 text-gray-600'>
                Become a Neighbourhood Washer and turn your appliances into an
                income source. Register your interest today to be among the
                first to get started in your area!
              </p>
              <Button
                asChild
                className='bg-yellow-500 text-white hover:bg-yellow-600'
              >
                <Link href='/dashboard/become-washer'>
                  Learn More & Register Interest
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      <p className='mb-2 text-gray-700'>
        You are signed in as:{' '}
        <span className='font-semibold'>{user.email}</span>
      </p>
      <p className='mb-6 text-gray-600'>This page is protected.</p>
      <div className='space-y-3'>
        <Link
          href='/'
          className='block w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700'
        >
          Go to Homepage
        </Link>
        <form
          action={signOut as (formData: FormData) => void}
          className='w-full'
        >
          <Button
            type='submit'
            variant='ghost'
            className='mt-2 w-full text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          >
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}

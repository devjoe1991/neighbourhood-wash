export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function BecomeWasherPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect(
      '/signin?message=Please sign in to learn about becoming a Washer.'
    )
  }

  // Placeholder: Check if user is already a washer later
  const isAlreadyWasher = false

  if (isAlreadyWasher) {
    // Optional: Redirect to a washer dashboard or show different content
    // For now, we can just show a message, or they might not even see the link in sidebar later.
  }

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-6'>
        <div className='rounded-lg bg-white p-8 shadow-md'>
          <h1 className='mb-6 text-3xl font-bold text-blue-600'>
            Become a Neighbourhood Washer
          </h1>

          {isAlreadyWasher ? (
            <div>
              <p className='text-lg text-gray-700'>
                You are already registered as a Washer!
              </p>
              <Link href='/dashboard/washer-hub'>
                {' '}
                {/* Placeholder link */}
                <Button className='mt-4'>Go to Washer Hub</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className='mb-4 text-lg text-gray-700'>
                Ready to turn your laundry appliances into an income source?
                Join our community of Washers!
              </p>

              <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
                <h2 className='mb-3 text-xl font-semibold text-blue-700'>
                  Why Become a Washer?
                </h2>
                <ul className='list-inside list-disc space-y-2 text-gray-600'>
                  <li>Earn extra income on your own schedule.</li>
                  <li>Help out your local community.</li>
                  <li>Easy-to-use platform to manage your services.</li>
                  <li>Flexible hours - work when it suits you.</li>
                  <li>Be part of a growing and supportive network.</li>
                </ul>
              </div>

              <div className='mb-6'>
                <h2 className='mb-3 text-xl font-semibold text-gray-700'>
                  The Process
                </h2>
                <ol className='list-inside list-decimal space-y-2 text-gray-600'>
                  <li>Express your interest by starting an application.</li>
                  <li>Complete our simple onboarding and verification.</li>
                  <li>Set up your services and availability.</li>
                  <li>Start accepting laundry jobs!</li>
                </ol>
              </div>

              <Button
                asChild
                className='w-full bg-blue-600 hover:bg-blue-700 md:w-auto'
              >
                <Link href='/dashboard/washer-application'>
                  {' '}
                  {/* Link to application form page */}
                  Start Your Washer Application (Coming Soon)
                </Link>
              </Button>

              <p className='mt-8 text-sm text-gray-500'>
                Note: The full Washer application and onboarding process is
                being finalized for our soft launch.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

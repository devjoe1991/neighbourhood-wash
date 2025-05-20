export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server_new' // Using the server_new client
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions' // Import the server action
import Sidebar from '@/components/dashboard/Sidebar' // Re-import the Sidebar component

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

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-6'>
        <div className='rounded-lg bg-white p-8 shadow-md'>
          <h1 className='mb-4 text-3xl font-bold text-blue-600'>
            Welcome to your Dashboard!
          </h1>
          <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <h2 className='mb-2 text-xl font-semibold text-blue-700'>
              Welcome to the Laundry Revolution!
            </h2>
            <p className='text-gray-600'>
              Congratulations on joining Neighbourhood Wash! You&apos;re now
              part of an exciting new way to manage laundry and connect with
              your community.
            </p>
            <p className='mt-2 text-gray-600'>
              Please note: You are currently experiencing our{' '}
              <strong className='text-blue-600'>
                Beta Version (Soft Launch)
              </strong>
              . We&apos;re actively working on adding more features and refining
              the experience. We&apos;ll keep you updated as we approach our
              full launch!
            </p>
          </div>
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
      </main>
    </div>
  )
}

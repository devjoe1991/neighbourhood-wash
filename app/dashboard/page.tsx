import Link from 'next/link'
import { createClient } from '@/utils/supabase/server' // Using the server client
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should ideally be caught by middleware,
    // but as a safeguard or if middleware is bypassed for any reason.
    return redirect('/signin?message=Please sign in to view the dashboard.')
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 py-2'>
      <div className='rounded-lg bg-white p-8 shadow-md'>
        <h1 className='mb-4 text-3xl font-bold text-blue-600'>
          Welcome to your Dashboard!
        </h1>
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
          {/* Add a sign-out button here eventually */}
          {/* e.g., <form action="/auth/signout" method="post"><Button type="submit">Sign Out</Button></form> */}
        </div>
      </div>
    </div>
  )
}

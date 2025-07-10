import { AlertCircle, Search } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getAvailableBookings } from '../actions'
import AvailableBookingsClient from './AvailableBookingsClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AvailableBookingsPage() {
  // Authentication and authorization checks
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin')
  }

  // Verify user is a washer and approved
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // This case should ideally not happen for a logged-in user
    // but redirecting to safety.
    console.error('Profile fetch error:', profileError)
    return redirect('/user/dashboard')
  }

  if (profile.role !== 'washer' || profile.washer_status !== 'approved') {
    // If not an approved washer, redirect them away.
    // They can apply from their dashboard.
    return redirect('/user/dashboard/become-washer?reason=not_approved')
  }

  const result = await getAvailableBookings()

  if (!result.success) {
    return (
      <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl'>
            Available Bookings
          </h1>
          <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
            Browse and accept laundry bookings in your area.
          </p>
        </div>

        <Card className='mx-auto max-w-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-700 dark:text-gray-300'>
              {result.message || 'Failed to fetch available bookings.'}
            </p>
            <p className='mt-2 text-sm text-gray-500'>
              Please try refreshing the page. If the problem persists, contact
              support.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookings = result.data || []

  return (
    <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl'>
          Available Bookings
        </h1>
        <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
          Browse and accept laundry bookings in your area. New jobs are posted
          regularly.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className='mx-auto max-w-lg'>
          <CardHeader className='items-center text-center'>
            <div className='mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
              <Search className='h-8 w-8 text-primary' />
            </div>
            <CardTitle>No Available Bookings</CardTitle>
            <CardDescription>
              There are no new jobs in your area right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-center'>
              <p className='text-gray-600 dark:text-gray-400'>
                Check back later, or make sure your service area is set
                correctly in your settings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AvailableBookingsClient bookings={bookings} />
      )}
    </div>
  )
}

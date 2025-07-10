import { Card, CardContent } from '@/components/ui/card'
import { Package, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getAvailableBookings } from '../actions'
import AvailableBookingsClient from './AvailableBookingsClient'

export default async function AvailableBookingsPage() {
  // Authentication and authorization checks
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Verify user is a washer and approve if not already
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // This case should ideally not happen for a logged-in user
    // but redirecting to safety.
    redirect('/user/dashboard')
  }

  if (profile.role !== 'washer') {
    // If not a washer, send to user dashboard
    redirect('/user/dashboard')
  }

  // TEMPORARY: For testing, auto-approve washer if they are not already
  if (profile.washer_status !== 'approved') {
    await supabase
      .from('profiles')
      .update({ washer_status: 'approved' })
      .eq('id', user.id)
    // Re-fetch profile to ensure UI consistency if needed, but for now we just approve.
  }

  const result = await getAvailableBookings()

  if (!result.success) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Available Bookings
            </h1>
            <p className='mt-2 text-gray-600'>
              Browse and accept laundry bookings in your area. You have until
              auto-assignment to claim these jobs.
            </p>
          </div>

          <div className='mb-6'>
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <AlertCircle className='h-5 w-5 text-red-400' />
                <div className='ml-3'>
                  <p className='text-sm text-red-800'>
                    {result.message || 'Failed to fetch available bookings'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bookings = result.data || []

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Available Bookings
          </h1>
          <p className='mt-2 text-gray-600'>
            Browse and accept laundry bookings in your area. You have until
            auto-assignment to claim these jobs.
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className='pt-6'>
              <div className='py-12 text-center'>
                <Package className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                  No Available Bookings
                </h3>
                <p className='text-gray-600'>
                  There are currently no bookings available in your area. Check
                  back later!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AvailableBookingsClient bookings={bookings} />
        )}
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Package, AlertCircle } from 'lucide-react'
import { getUserBookings } from './actions'
import BookingListItem from '@/components/bookings/BookingListItem'

async function BookingsList() {
  const result = await getUserBookings()

  if (!result.success) {
    return (
      <Card className='border-red-200 bg-red-50'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 text-red-700'>
            <AlertCircle className='h-5 w-5' />
            <span>{result.message}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const bookings = result.data || []

  if (bookings.length === 0) {
    return (
      <Card className='border-gray-200'>
        <CardContent className='p-12 text-center'>
          <div className='flex flex-col items-center gap-4'>
            <Package className='h-12 w-12 text-gray-400' />
            <div className='space-y-2'>
              <h3 className='text-lg font-medium text-gray-900'>
                No bookings yet
              </h3>
              <p className='text-gray-600'>
                You haven't created any bookings yet. Ready to get your laundry
                done?
              </p>
            </div>
            <Link href='/dashboard/new-booking'>
              <Button className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Your First Booking
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {bookings.map((booking) => (
        <BookingListItem key={booking.id} booking={booking} />
      ))}
    </div>
  )
}

function BookingsListSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='animate-pulse'>
          <CardContent className='p-6'>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <div className='space-y-2'>
                  <div className='h-4 w-32 rounded bg-gray-200' />
                  <div className='h-4 w-24 rounded bg-gray-200' />
                </div>
                <div className='h-6 w-20 rounded bg-gray-200' />
              </div>
              <div className='h-4 w-48 rounded bg-gray-200' />
              <div className='flex items-center justify-between'>
                <div className='h-6 w-16 rounded bg-gray-200' />
                <div className='h-8 w-24 rounded bg-gray-200' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyBookingsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>My Bookings</h1>
            <p className='mt-2 text-gray-600'>
              Track and manage all your laundry bookings
            </p>
          </div>
          <Link href='/dashboard/new-booking'>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Bookings List */}
        <Suspense fallback={<BookingsListSkeleton />}>
          <BookingsList />
        </Suspense>
      </div>
    </div>
  )
}

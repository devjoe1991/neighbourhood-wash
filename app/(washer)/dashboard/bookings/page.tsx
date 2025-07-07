import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  User,
  PoundSterling,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
} from 'lucide-react'
import { getAssignedBookings } from '../actions'

export const dynamic = 'force-dynamic'

export default async function WasherBookingsPage() {
  const result = await getAssignedBookings()

  if (!result.success) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <AlertCircle className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Bookings
              </h3>
              <p className='text-gray-600'>{result.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookings = result.data

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_assignment':
        return 'bg-orange-100 text-orange-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (
    status: string,
    isCollectionVerified: boolean,
    isDeliveryVerified: boolean
  ) => {
    if (status === 'completed') {
      return <CheckCircle className='h-4 w-4' />
    }
    if (isDeliveryVerified) {
      return <Truck className='h-4 w-4' />
    }
    if (isCollectionVerified) {
      return <Package className='h-4 w-4' />
    }
    return <Clock className='h-4 w-4' />
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>My Bookings</h1>
          <p className='mt-2 text-gray-600'>
            Manage your assigned laundry bookings and verify handovers
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className='pt-6'>
              <div className='py-12 text-center'>
                <Package className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                  No Bookings Yet
                </h3>
                <p className='text-gray-600'>
                  You don't have any assigned bookings at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {bookings.map((booking) => {
              const isCollectionVerified = !!booking.collection_verified_at
              const isDeliveryVerified = !!booking.delivery_verified_at

              return (
                <Card
                  key={booking.id}
                  className='transition-shadow hover:shadow-md'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>
                        Booking #{booking.id}
                      </CardTitle>
                      <Badge
                        className={`${getStatusColor(booking.status)} gap-1`}
                        variant='secondary'
                      >
                        {getStatusIcon(
                          booking.status,
                          isCollectionVerified,
                          isDeliveryVerified
                        )}
                        {booking.status === 'awaiting_assignment' &&
                          'Awaiting Assignment'}
                        {booking.status === 'in_progress' && 'In Progress'}
                        {booking.status === 'completed' && 'Completed'}
                        {booking.status === 'cancelled' && 'Cancelled'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4 text-gray-500' />
                        <div>
                          <p className='text-sm font-medium'>
                            {booking.user?.full_name || 'Customer'}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {booking.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-gray-500' />
                        <div>
                          <p className='text-sm font-medium'>
                            {formatDate(booking.collection_date)}
                          </p>
                          <p className='text-xs text-gray-500'>
                            Collection Date
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-gray-500' />
                        <div>
                          <p className='text-sm font-medium'>
                            {booking.collection_time_slot}
                          </p>
                          <p className='text-xs text-gray-500'>Time Slot</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <PoundSterling className='h-4 w-4 text-gray-500' />
                        <div>
                          <p className='text-sm font-medium'>
                            {formatPrice(booking.total_price)}
                          </p>
                          <p className='text-xs text-gray-500'>Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className='mb-4 flex items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <Package className='h-4 w-4 text-gray-500' />
                        <span className='text-sm'>
                          Collection:{' '}
                          {isCollectionVerified ? (
                            <span className='font-medium text-green-600'>
                              Verified
                            </span>
                          ) : (
                            <span className='text-gray-500'>Pending</span>
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Truck className='h-4 w-4 text-gray-500' />
                        <span className='text-sm'>
                          Delivery:{' '}
                          {isDeliveryVerified ? (
                            <span className='font-medium text-green-600'>
                              Verified
                            </span>
                          ) : (
                            <span className='text-gray-500'>Pending</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className='flex justify-end'>
                      <Button asChild variant='outline'>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

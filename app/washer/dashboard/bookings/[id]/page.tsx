import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Package,
  AlertCircle,
} from 'lucide-react'
import { requireWasherVerification } from '@/lib/middleware/washer-verification'
import { getBookingDetails, WasherBooking } from '../../actions'
import WasherBookingClient from './WasherBookingClient'

interface WasherBookingDetailPageProps {
  params: Promise<{ id: string }>
}

async function fetchBooking(bookingId: number, _userId: string): Promise<{
  booking: WasherBooking | null
  error: string | null
}> {
  try {
    // Get booking details
    const result = await getBookingDetails(bookingId)

    if (!result.success || !result.data) {
      return {
        booking: null,
        error: result.message || 'Failed to fetch booking details',
      }
    }

    // Note: Authorization already handled by getBookingDetails which filters by washer_id
    return {
      booking: result.data,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return {
      booking: null,
      error: 'An unexpected error occurred',
    }
  }
}

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

const parseServicesConfig = (config: Record<string, unknown>) => {
  try {
    return {
      weightTier: config.weightTier as string,
      baseService: config.baseService as { name: string; price: number },
      selectedItems: config.selectedItems as Array<{
        key: string
        name: string
        price: number
      }>,
      selectedAddOns: config.selectedAddOns as Array<{
        key: string
        name: string
        price: number
      }>,
      collectionFee: config.collectionFee as number,
    }
  } catch {
    return null
  }
}

export default async function WasherBookingDetailPage({
  params,
}: WasherBookingDetailPageProps) {
  const { id } = await params
  const bookingId = Number(id)

  if (isNaN(bookingId)) {
    notFound()
  }

  // Check authentication, washer status, and verification
  const { user } = await requireWasherVerification()

  if (!user) {
    notFound()
  }

  const { booking, error } = await fetchBooking(bookingId, user.id)

  if (error || !booking) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <AlertCircle className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Booking
              </h3>
              <p className='mb-4 text-gray-600'>{error}</p>
              <Button asChild variant='outline'>
                <Link href='/washer/dashboard/bookings'>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to Bookings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const servicesConfig = parseServicesConfig(booking.services_config)

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button asChild variant='outline' className='mb-4'>
            <Link href='/washer/dashboard/bookings'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Bookings
            </Link>
          </Button>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Booking #{booking.id}
              </h1>
              <p className='mt-2 text-gray-600'>
                Booking details and PIN verification
              </p>
            </div>
            <Badge
              className={`${getStatusColor(booking.status)} px-3 py-2 text-sm`}
              variant='secondary'
            >
              {booking.status === 'awaiting_assignment' &&
                'Awaiting Assignment'}
              {booking.status === 'in_progress' && 'In Progress'}
              {booking.status === 'completed' && 'Completed'}
              {booking.status === 'cancelled' && 'Cancelled'}
            </Badge>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Left Column - Booking Details */}
          <div className='space-y-6'>
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-600'>
                    Name:
                  </span>
                  <p className='text-gray-900'>
                    {booking.user?.full_name || 'Customer'}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-600'>
                    Email:
                  </span>
                  <p className='text-gray-900'>{booking.user?.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-600'>
                    Collection Date:
                  </span>
                  <p className='text-gray-900'>
                    {formatDate(booking.collection_date)}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-600'>
                    Time Slot:
                  </span>
                  <p className='text-gray-900'>
                    {booking.collection_time_slot}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-600'>
                    Total Price:
                  </span>
                  <p className='text-lg font-semibold text-gray-900'>
                    {formatPrice(booking.total_price)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            {servicesConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-gray-600'>
                      Weight Tier:
                    </span>
                    <p className='text-gray-900'>{servicesConfig.weightTier}</p>
                  </div>

                  <div>
                    <span className='text-sm font-medium text-gray-600'>
                      Base Service:
                    </span>
                    <p className='text-gray-900'>
                      {servicesConfig.baseService?.name} -{' '}
                      {formatPrice(servicesConfig.baseService?.price || 0)}
                    </p>
                  </div>

                  {servicesConfig.selectedItems?.length > 0 && (
                    <div>
                      <span className='text-sm font-medium text-gray-600'>
                        Items:
                      </span>
                      <ul className='mt-1 space-y-1'>
                        {servicesConfig.selectedItems.map((item, index) => (
                          <li key={index} className='text-sm text-gray-900'>
                            • {item.name} - {formatPrice(item.price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {servicesConfig.selectedAddOns?.length > 0 && (
                    <div>
                      <span className='text-sm font-medium text-gray-600'>
                        Add-ons:
                      </span>
                      <ul className='mt-1 space-y-1'>
                        {servicesConfig.selectedAddOns.map((addon, index) => (
                          <li key={index} className='text-sm text-gray-900'>
                            • {addon.name} - {formatPrice(addon.price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />
                  <div className='flex justify-between font-semibold'>
                    <span>Total:</span>
                    <span>{formatPrice(booking.total_price)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Instructions */}
            {booking.special_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-gray-900'>
                    {booking.special_instructions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Interactive Components */}
          <WasherBookingClient
            booking={booking}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}

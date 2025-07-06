import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Calendar,
  Clock,
  Package,
  PoundSterling,
  Shield,
  Search,
  ArrowRight,
} from 'lucide-react'
import { getBookingById } from '@/app/dashboard/my-bookings/actions'

interface BookingConfirmationPageProps {
  params: { id: string }
}

export default async function BookingConfirmationPage({
  params,
}: BookingConfirmationPageProps) {
  const result = await getBookingById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const booking = result.data

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getServicesSummary = (servicesConfig: Record<string, unknown>) => {
    if (!servicesConfig) return 'Standard Service'

    const parts: string[] = []

    // Base service
    if (
      servicesConfig.baseService &&
      typeof servicesConfig.baseService === 'object'
    ) {
      const baseService = servicesConfig.baseService as { label: string }
      if (baseService.label) {
        parts.push(baseService.label)
      }
    }

    // Special items count
    if (
      Array.isArray(servicesConfig.selectedItems) &&
      servicesConfig.selectedItems.length > 0
    ) {
      const count = servicesConfig.selectedItems.length
      parts.push(`${count} Special Item${count > 1 ? 's' : ''}`)
    }

    return parts.join(', ') || 'Standard Service'
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Main Confirmation */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
              <CheckCircle className='h-12 w-12 text-green-600' />
            </div>
          </div>
          <h1 className='mb-2 text-4xl font-bold text-gray-900'>
            Booking Confirmed!
          </h1>
          <p className='mb-6 text-xl text-gray-600'>
            Your payment has been processed successfully
          </p>
          <p className='text-lg text-gray-700'>
            Your collection is scheduled for{' '}
            <span className='font-semibold text-blue-600'>
              {formatDate(booking.collection_date)}
            </span>{' '}
            between{' '}
            <span className='font-semibold text-blue-600'>
              {booking.collection_time_slot}
            </span>
          </p>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='h-5 w-5' />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Booking ID</span>
                <span className='font-mono font-semibold'>#{booking.id}</span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Service</span>
                <span className='font-medium'>
                  {getServicesSummary(booking.services_config)}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Collection Date</span>
              </div>
              <p className='ml-6 font-medium'>
                {formatDate(booking.collection_date)}
              </p>

              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Time Slot</span>
              </div>
              <p className='ml-6 font-medium'>{booking.collection_time_slot}</p>

              <Separator />

              <div className='flex items-center justify-between text-lg font-semibold'>
                <span className='flex items-center gap-2'>
                  <PoundSterling className='h-5 w-5' />
                  Total Paid
                </span>
                <span className='text-green-600'>
                  £{booking.total_price.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ArrowRight className='h-5 w-5' />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Step 1 */}
              <div className='flex gap-4'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600'>
                  1
                </div>
                <div>
                  <h4 className='mb-2 flex items-center gap-2 font-semibold text-gray-900'>
                    <Search className='h-4 w-4' />
                    Washer Assignment
                  </h4>
                  <p className='text-sm text-gray-600'>
                    We are now finding the perfect local washer for you. You
                    will be notified via email and on your dashboard
                    approximately <strong>12 hours before</strong> your
                    scheduled collection time.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className='flex gap-4'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600'>
                  2
                </div>
                <div>
                  <h4 className='mb-2 flex items-center gap-2 font-semibold text-gray-900'>
                    <Package className='h-4 w-4' />
                    Prepare Your Laundry
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Please have your laundry ready for collection at the
                    scheduled time. Include any items mentioned in your booking.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className='flex gap-4'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600'>
                  3
                </div>
                <div>
                  <h4 className='mb-2 flex items-center gap-2 font-semibold text-gray-900'>
                    <Shield className='h-4 w-4' />
                    Secure Handover
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Your unique 4-digit PIN codes for collection and delivery
                    are now available on the booking details page. You will need
                    these to confirm the handover with your washer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
          <Link href={`/dashboard/my-bookings/${booking.id}`}>
            <Button size='lg' className='w-full gap-2 sm:w-auto'>
              <Package className='h-4 w-4' />
              View Booking Details
            </Button>
          </Link>
          <Link href='/dashboard'>
            <Button variant='outline' size='lg' className='w-full sm:w-auto'>
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-600'>
            Questions about your booking?{' '}
            <Link
              href='/dashboard/my-bookings'
              className='font-medium text-blue-600 hover:text-blue-800'
            >
              Visit your bookings page
            </Link>{' '}
            or contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}

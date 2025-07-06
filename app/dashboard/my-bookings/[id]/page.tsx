'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  User,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react'
import {
  getBookingById,
  cancelBooking,
  type BookingWithWasher,
} from '../actions'
import StatusTracker from '@/components/bookings/StatusTracker'
import { toast } from 'sonner'

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const [booking, setBooking] = useState<BookingWithWasher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setBookingId(id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!bookingId) return

    const fetchBooking = async () => {
      try {
        setIsLoading(true)
        const result = await getBookingById(bookingId)

        if (!result.success || !result.data) {
          setError(result.message || 'Booking not found')
          return
        }

        setBooking(result.data)
      } catch (err) {
        setError('Failed to load booking')
        console.error('Error fetching booking:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  const handleCancelBooking = async () => {
    if (!booking || !bookingId) return

    setIsCancelling(true)
    try {
      const result = await cancelBooking(booking.id.toString())

      if (result.success) {
        toast.success(result.message)
        // Refresh the booking data to show updated status
        const updatedResult = await getBookingById(bookingId)
        if (updatedResult.success && updatedResult.data) {
          setBooking(updatedResult.data)
        }
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
      toast.error('Failed to cancel booking. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'awaiting_assignment':
        return 'Awaiting Assignment'
      case 'washer_assigned':
        return 'Washer Assigned'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'awaiting_assignment':
        return 'secondary'
      case 'washer_assigned':
        return 'default'
      case 'in_progress':
        return 'outline'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const renderServiceDetails = (servicesConfig: Record<string, unknown>) => {
    if (!servicesConfig) return null

    const items: { label: string; price: number }[] = []

    // Base service
    if (
      servicesConfig.baseService &&
      typeof servicesConfig.baseService === 'object'
    ) {
      const baseService = servicesConfig.baseService as {
        label: string
        price: number
      }
      items.push({
        label: baseService.label,
        price: baseService.price,
      })
    }

    // Special items
    if (
      Array.isArray(servicesConfig.selectedItems) &&
      servicesConfig.selectedItems.length > 0
    ) {
      servicesConfig.selectedItems.forEach((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const serviceItem = item as { label: string; price: number }
          items.push({
            label: serviceItem.label,
            price: serviceItem.price,
          })
        }
      })
    }

    // Add-ons
    if (
      Array.isArray(servicesConfig.selectedAddOns) &&
      servicesConfig.selectedAddOns.length > 0
    ) {
      servicesConfig.selectedAddOns.forEach((addon: unknown) => {
        if (typeof addon === 'object' && addon !== null) {
          const serviceAddon = addon as { label: string; price: number }
          items.push({
            label: serviceAddon.label,
            price: serviceAddon.price,
          })
        }
      })
    }

    return items
  }

  const serviceDetails = renderServiceDetails(booking.services_config)

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link href='/dashboard/my-bookings'>
            <Button variant='ghost' className='mb-4 gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to My Bookings
            </Button>
          </Link>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Booking #{booking.id}
              </h1>
              <p className='mt-2 text-gray-600'>
                Booking created on{' '}
                {new Date(booking.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
            <Badge
              variant={getStatusBadgeVariant(booking.status)}
              className='text-sm'
            >
              {getStatusLabel(booking.status)}
            </Badge>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Status Tracker */}
          <div className='lg:col-span-1'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='h-5 w-5' />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTracker currentStatus={booking.status} />
              </CardContent>
            </Card>

            {/* Cancel Booking Card */}
            {booking.status !== 'cancelled' &&
              booking.status !== 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <X className='h-5 w-5' />
                      Booking Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='destructive'
                          className='w-full'
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking?
                            <br />
                            <br />
                            <strong>Cancellation Policy:</strong> Cancellations
                            made less than 12 hours before the collection time
                            are non-refundable.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelBooking}
                            className='bg-red-600 hover:bg-red-700'
                            disabled={isCancelling}
                          >
                            {isCancelling
                              ? 'Cancelling...'
                              : 'Yes, Cancel Booking'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Main Content */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Collection Details */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Collection Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-600'>Collection Date</p>
                      <p className='font-medium'>
                        {formatDate(booking.collection_date)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-600'>Time Slot</p>
                      <p className='font-medium'>
                        {booking.collection_time_slot}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='h-5 w-5' />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {serviceDetails?.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-gray-700'>{item.label}</span>
                      <span className='font-medium'>
                        £{item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className='flex items-center justify-between text-lg font-semibold'>
                    <span>Total</span>
                    <span>£{booking.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {booking.special_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-gray-700'>
                    {booking.special_instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Washer Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Washer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.washer_id && booking.washer_profile ? (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                        <User className='h-6 w-6 text-blue-600' />
                      </div>
                      <div>
                        <p className='font-medium'>
                          {booking.washer_profile.first_name}{' '}
                          {booking.washer_profile.last_name}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Your assigned washer
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Phone className='h-4 w-4' />
                      <span>{booking.washer_profile.phone_number}</span>
                    </div>
                    <div className='flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700'>
                      <CheckCircle className='h-4 w-4' />
                      <span className='text-sm'>
                        Washer assigned successfully
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-700'>
                    <AlertTriangle className='h-4 w-4' />
                    <span className='text-sm'>
                      We are finding the perfect washer for your booking. You
                      will be notified 12 hours before your collection time.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageCircle className='h-5 w-5' />
                  Chat with Washer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='py-8 text-center'>
                  <MessageCircle className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                  <p className='mb-2 text-gray-600'>
                    Chat with your washer will be enabled once they are assigned
                  </p>
                  <Button disabled className='gap-2'>
                    <MessageCircle className='h-4 w-4' />
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

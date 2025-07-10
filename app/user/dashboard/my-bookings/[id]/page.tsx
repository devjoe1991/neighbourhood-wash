import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  User,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { getBookingById } from '../actions'
import StatusTracker from '@/components/bookings/StatusTracker'
import PinVerification from '@/components/booking/PinVerification'
import ChatInterface from '@/components/chat/ChatInterface'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import BookingDetailClient from './BookingDetailClient'

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params

  // Get current user ID on server with authentication
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch booking data on server
  const result = await getBookingById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const booking = result.data

  // Verify user owns this booking
  if (booking.user_id !== user.id) {
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

    // Selected items
    if (
      servicesConfig.selectedItems &&
      Array.isArray(servicesConfig.selectedItems)
    ) {
      servicesConfig.selectedItems.forEach(
        (item: { name?: string; price?: number }) => {
          if (item.name && item.price) {
            items.push({
              label: item.name,
              price: item.price,
            })
          }
        }
      )
    }

    // Selected add-ons
    if (
      servicesConfig.selectedAddOns &&
      Array.isArray(servicesConfig.selectedAddOns)
    ) {
      servicesConfig.selectedAddOns.forEach(
        (addon: { name?: string; price?: number }) => {
          if (addon.name && addon.price) {
            items.push({
              label: addon.name,
              price: addon.price,
            })
          }
        }
      )
    }

    return (
      <div className='space-y-2'>
        {items.map((item, index) => (
          <div key={index} className='flex justify-between text-sm'>
            <span>{item.label}</span>
            <span>£{item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }

  const showChatInterface =
    booking.status === 'washer_assigned' || booking.status === 'in_progress'

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/dashboard/my-bookings'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to My Bookings
          </Link>
          <div className='mt-4 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Booking #{booking.id}
              </h1>
              <p className='mt-1 text-gray-600'>
                {formatDate(booking.collection_date)} •{' '}
                {booking.collection_time_slot}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(booking.status)}>
              {getStatusLabel(booking.status)}
            </Badge>
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            <div className='space-y-6'>
              {/* Status Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusTracker currentStatus={booking.status} />
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
                  <div className='space-y-4'>
                    {renderServiceDetails(booking.services_config)}

                    <Separator />

                    <div className='flex justify-between font-semibold'>
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

              {/* PIN Verification */}
              {(booking.status === 'washer_assigned' ||
                booking.status === 'in_progress') && (
                <Card>
                  <CardHeader>
                    <CardTitle>PIN Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PinVerification booking={booking} />
                  </CardContent>
                </Card>
              )}

              {/* Chat Interface */}
              {showChatInterface && booking.washer_id && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MessageCircle className='h-5 w-5' />
                      Chat with {booking.washer_profile?.first_name || 'Washer'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatInterface
                      bookingId={booking.id}
                      currentUserId={user.id}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Washer Information */}
            {booking.washer_profile && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='h-5 w-5' />
                    Your Washer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div>
                      <p className='font-semibold'>
                        {booking.washer_profile.first_name}{' '}
                        {booking.washer_profile.last_name}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Professional Washer
                      </p>
                    </div>

                    {booking.washer_profile.phone_number && (
                      <div className='flex items-center gap-2 text-sm'>
                        <Phone className='h-4 w-4 text-gray-500' />
                        <span>{booking.washer_profile.phone_number}</span>
                      </div>
                    )}

                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='h-4 w-4 text-gray-500' />
                      <span>Assigned {formatDate(booking.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span>
                      Collection: {formatDate(booking.collection_date)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='h-4 w-4 text-gray-500' />
                    <span>Time: {booking.collection_time_slot}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Package className='h-4 w-4 text-gray-500' />
                    <span>Order ID: #{booking.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <BookingDetailClient booking={booking} />
          </div>
        </div>
      </div>
    </div>
  )
}

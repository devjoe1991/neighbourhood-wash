'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { acceptBooking } from '../actions'

interface AvailableBooking {
  id: number
  collection_date: string
  collection_time_slot: string
  total_price: number
  services_config: Record<string, unknown>
  special_instructions: string | null
  created_at: string
  user: {
    first_name: string
    last_name: string
    postcode: string
  }
}

interface AvailableBookingsClientProps {
  bookings: AvailableBooking[]
}

export default function AvailableBookingsClient({
  bookings: initialBookings,
}: AvailableBookingsClientProps) {
  const [bookings, setBookings] = useState<AvailableBooking[]>(initialBookings)
  const [accepting, setAccepting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAcceptBooking = async (bookingId: number) => {
    setAccepting(bookingId)
    try {
      const result = await acceptBooking(bookingId)
      if (result.success) {
        // Remove the accepted booking from the list
        setBookings((prev) => prev.filter((b) => b.id !== bookingId))
        setError(null)
      } else {
        setError(result.message || 'Failed to accept booking')
      }
    } catch (error) {
      console.error('Error accepting booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setAccepting(null)
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

  const getTimeUntilCollection = (collectionDate: string) => {
    const now = new Date()
    const collection = new Date(collectionDate)
    const diffInHours = Math.floor(
      (collection.getTime() - now.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 24) {
      return `${diffInHours}h remaining`
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days}d ${diffInHours % 24}h remaining`
    }
  }

  const parseServicesConfig = (config: Record<string, unknown>) => {
    try {
      return {
        weightTier: config.weightTier as string,
        baseService: config.baseService as { name: string; price: number },
        selectedItems: config.selectedItems as Array<{ name: string }>,
        selectedAddOns: config.selectedAddOns as Array<{ name: string }>,
      }
    } catch {
      return null
    }
  }

  const maskPostcode = (postcode: string) => {
    // Show only the first part of postcode (e.g., "SW1A" from "SW1A 1AA")
    return postcode.split(' ')[0] || postcode.substring(0, 4)
  }

  const formatUserName = (firstName: string, lastName: string) => {
    // Show first name + first initial of surname (e.g., "John D.")
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='py-12 text-center'>
            <p className='text-gray-600'>
              No more bookings available. Great job accepting all available
              work!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {error && (
        <div className='mb-6'>
          <div className='rounded-md bg-red-50 p-4'>
            <div className='flex'>
              <AlertCircle className='h-5 w-5 text-red-400' />
              <div className='ml-3'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-6'>
        {bookings.map((booking) => {
          const servicesConfig = parseServicesConfig(booking.services_config)
          const isAccepting = accepting === booking.id

          return (
            <Card
              key={booking.id}
              className='transition-shadow hover:shadow-md'
            >
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>
                    Booking #{booking.id}
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='secondary'
                      className='bg-blue-100 text-blue-800'
                    >
                      <Clock className='mr-1 h-3 w-3' />
                      {getTimeUntilCollection(booking.collection_date)}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='border-green-300 text-green-700'
                    >
                      {formatPrice(booking.total_price)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className='space-y-4'>
                  {/* Customer & Location Info */}
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='flex items-center gap-3'>
                      <User className='h-5 w-5 text-gray-500' />
                      <div>
                        <p className='font-medium text-gray-900'>
                          {formatUserName(
                            booking.user.first_name,
                            booking.user.last_name
                          )}
                        </p>
                        <p className='text-sm text-gray-500'>Customer</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <MapPin className='h-5 w-5 text-gray-500' />
                      <div>
                        <p className='font-medium text-gray-900'>
                          {maskPostcode(booking.user.postcode)} area
                        </p>
                        <p className='text-sm text-gray-500'>Location</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <Calendar className='h-5 w-5 text-gray-500' />
                      <div>
                        <p className='font-medium text-gray-900'>
                          {formatDate(booking.collection_date)}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {booking.collection_time_slot}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  {servicesConfig && (
                    <div className='rounded-lg bg-gray-50 p-4'>
                      <h4 className='mb-2 font-medium text-gray-900'>
                        Service Details
                      </h4>
                      <div className='space-y-2'>
                        <p className='text-sm'>
                          <span className='font-medium'>Service:</span>{' '}
                          {servicesConfig.baseService.name}
                        </p>
                        <p className='text-sm'>
                          <span className='font-medium'>Weight Tier:</span>{' '}
                          {servicesConfig.weightTier}
                        </p>
                        {servicesConfig.selectedItems.length > 0 && (
                          <p className='text-sm'>
                            <span className='font-medium'>Special Items:</span>{' '}
                            {servicesConfig.selectedItems
                              .map((item) => item.name)
                              .join(', ')}
                          </p>
                        )}
                        {servicesConfig.selectedAddOns.length > 0 && (
                          <p className='text-sm'>
                            <span className='font-medium'>Add-ons:</span>{' '}
                            {servicesConfig.selectedAddOns
                              .map((addon) => addon.name)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {booking.special_instructions && (
                    <div className='rounded-lg bg-blue-50 p-4'>
                      <h4 className='mb-2 font-medium text-blue-900'>
                        Special Instructions
                      </h4>
                      <p className='text-sm text-blue-800'>
                        {booking.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className='flex justify-end pt-4'>
                    <Button
                      onClick={() => handleAcceptBooking(booking.id)}
                      disabled={isAccepting}
                      className='gap-2'
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className='h-4 w-4' />
                          Accept Booking
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

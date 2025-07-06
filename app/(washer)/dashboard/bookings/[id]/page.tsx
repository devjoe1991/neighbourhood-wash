'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
import { getBookingDetails, WasherBooking } from '../../actions'
import PinInput from '@/components/washer/PinInput'

export default function WasherBookingDetailPage() {
  const params = useParams()
  const [booking, setBooking] = useState<WasherBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookingDetails = useCallback(async () => {
    if (!params.id) return

    setIsLoading(true)
    try {
      const result = await getBookingDetails(Number(params.id))
      if (result.success && result.data) {
        setBooking(result.data)
        setError(null)
      } else {
        setError(result.message || 'Failed to fetch booking details')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchBookingDetails()
  }, [fetchBookingDetails])

  const handleVerificationSuccess = () => {
    // Refetch booking details to update the UI
    fetchBookingDetails()
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
                <Link href='/dashboard/bookings'>
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
            <Link href='/dashboard/bookings'>
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
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Name</p>
                  <p className='text-lg font-semibold'>
                    {booking.user?.full_name || 'Customer'}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Email</p>
                  <p className='text-gray-900'>{booking.user?.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm font-medium text-gray-500'>
                      Collection Date
                    </p>
                    <p className='text-gray-900'>
                      {formatDate(booking.collection_date)}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-500'>
                      Time Slot
                    </p>
                    <p className='text-gray-900'>
                      {booking.collection_time_slot}
                    </p>
                  </div>
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
                    <p className='font-semibold'>
                      {servicesConfig.baseService.name}
                    </p>
                    <p className='text-sm text-gray-600'>
                      Weight Tier: {servicesConfig.weightTier}
                    </p>
                    <p className='text-sm font-medium'>
                      {formatPrice(servicesConfig.baseService.price)}
                    </p>
                  </div>

                  {servicesConfig.selectedItems.length > 0 && (
                    <div>
                      <Separator className='my-3' />
                      <p className='mb-2 font-medium'>Special Items:</p>
                      {servicesConfig.selectedItems.map((item, index) => (
                        <div
                          key={index}
                          className='flex justify-between text-sm'
                        >
                          <span>{item.name}</span>
                          <span>{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {servicesConfig.selectedAddOns.length > 0 && (
                    <div>
                      <Separator className='my-3' />
                      <p className='mb-2 font-medium'>Add-ons:</p>
                      {servicesConfig.selectedAddOns.map((addon, index) => (
                        <div
                          key={index}
                          className='flex justify-between text-sm'
                        >
                          <span>{addon.name}</span>
                          <span>{formatPrice(addon.price)}</span>
                        </div>
                      ))}
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
                  <p className='text-gray-700'>
                    {booking.special_instructions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - PIN Verification */}
          <div>
            <PinInput
              booking={booking}
              onVerificationSuccess={handleVerificationSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

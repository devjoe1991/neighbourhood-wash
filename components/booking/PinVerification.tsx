'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BookingWithWasher } from '@/app/user/dashboard/my-bookings/actions'

interface PinVerificationProps {
  booking: BookingWithWasher
}

export default function PinVerification({ booking }: PinVerificationProps) {
  const pinToDisplay =
    booking.status === 'awaiting_collection' ||
    booking.status === 'washer_assigned'
      ? booking.collection_pin
      : booking.delivery_pin

  const cardTitle =
    booking.status === 'awaiting_collection' ||
    booking.status === 'washer_assigned'
      ? 'Collection PIN'
      : 'Delivery PIN'

  const cardDescription =
    booking.status === 'awaiting_collection' ||
    booking.status === 'washer_assigned'
      ? 'Show this PIN to your washer upon collection.'
      : 'Show this PIN to your washer upon delivery.'

  if (!pinToDisplay) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className='flex items-center justify-center p-6'>
        <div className='text-4xl font-bold tracking-widest text-blue-600'>
          {pinToDisplay.split('').join(' ')}
        </div>
      </CardContent>
    </Card>
  )
}

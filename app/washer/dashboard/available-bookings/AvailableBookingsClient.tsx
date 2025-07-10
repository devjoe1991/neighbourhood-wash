'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, PoundSterling } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { acceptBooking } from '../actions'

type Booking = {
  id: number
  collection_date: string
  collection_time_slot: string
  total_price: number
  user_profile: {
    postcode: string | null
  } | null
}

interface AvailableBookingsClientProps {
  bookings: Booking[]
}

function BookingCard({ booking }: { booking: Booking }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setIsAccepting(true)
    const result = await acceptBooking(booking.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
      setIsAccepting(false)
    }
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle className='text-lg'>
          Booking in {booking.user_profile?.postcode || 'N/A'}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex-grow space-y-3'>
        <div className='flex items-center text-sm text-gray-600'>
          <Calendar className='mr-2 h-4 w-4' />
          <span>{new Date(booking.collection_date).toLocaleDateString()}</span>
        </div>
        <div className='flex items-center text-sm text-gray-600'>
          <Clock className='mr-2 h-4 w-4' />
          <span>{booking.collection_time_slot}</span>
        </div>
        <div className='flex items-center text-sm font-semibold'>
          <PoundSterling className='mr-2 h-4 w-4' />
          <span>{booking.total_price.toFixed(2)}</span>
        </div>
      </CardContent>
      <div className='border-t p-4'>
        <Button
          className='w-full'
          onClick={handleAccept}
          disabled={isAccepting}
        >
          {isAccepting ? 'Accepting...' : 'Accept Booking'}
        </Button>
      </div>
    </Card>
  )
}

export default function AvailableBookingsClient({
  bookings,
}: AvailableBookingsClientProps) {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}

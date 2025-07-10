'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { X } from 'lucide-react'
import { cancelBooking, type BookingWithWasher } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BookingDetailClientProps {
  booking: BookingWithWasher
}

export default function BookingDetailClient({
  booking,
}: BookingDetailClientProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const router = useRouter()

  const handleCancelBooking = async () => {
    setIsCancelling(true)
    try {
      const result = await cancelBooking(booking.id.toString())

      if (result.success) {
        toast.success(result.message)
        // Refresh the page to show updated status
        router.refresh()
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

  // Only show cancel button if booking is not already cancelled or completed
  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return null
  }

  return (
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
                <strong>Cancellation Policy:</strong> Cancellations made less
                than 12 hours before the collection time are non-refundable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                className='bg-red-600 hover:bg-red-700'
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

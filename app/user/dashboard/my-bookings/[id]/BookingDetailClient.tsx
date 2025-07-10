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
  const [showNoRefundDialog, setShowNoRefundDialog] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const result = await cancelBooking(booking.id.toString())

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else if (result.code === 'CONFIRM_NO_REFUND') {
        // First dialog closes, second one opens
        setShowNoRefundDialog(true)
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
      toast.error('Failed to cancel booking. Please try again.')
    } finally {
      // Don't set isCancelling to false if we're showing the next dialog
      if (!showNoRefundDialog) {
        setIsCancelling(false)
      }
    }
  }

  const handleForceCancel = async () => {
    // isCancelling should already be true
    try {
      const result = await cancelBooking(booking.id.toString(), {
        confirmNoRefund: true,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error('Error force cancelling booking:', err)
      toast.error('Failed to cancel booking. Please try again.')
    } finally {
      setShowNoRefundDialog(false)
      setIsCancelling(false)
    }
  }

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
        {/* Initial Cancellation Dialog */}
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
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Please review the cancellation
                policy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isCancelling}
                className='bg-red-600 hover:bg-red-700'
              >
                Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog for non-refundable cancellation */}
        <AlertDialog
          open={showNoRefundDialog}
          onOpenChange={setShowNoRefundDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirm Non-Refundable Cancellation
              </AlertDialogTitle>
              <AlertDialogDescription>
                This booking is within 12 hours of the scheduled collection time
                and is non-refundable.
                <br />
                <br />
                Are you sure you want to cancel this booking without a refund?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setIsCancelling(false)}
                disabled={isCancelling}
              >
                Keep Booking
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceCancel}
                className='bg-red-600 hover:bg-red-700'
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Anyway'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

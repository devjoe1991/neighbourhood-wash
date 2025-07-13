'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Calendar,
  Clock,
  Lock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { BookingSelection } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { createCheckoutSession } from '@/app/user/dashboard/new-booking/actions' // Hypothetical action
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentStepProps {
  // Simplified props for the new flow
  totalPrice: number
  itemizedBreakdown: Array<{
    label: string
    price: number | null
    isSubItem?: boolean
  }>
  selection: BookingSelection
  specialInstructions: string
  onFinalizeBooking: () => Promise<{
    success: boolean
    bookingId?: number
    washerId?: string
  }> // This prop will now create the booking and return the IDs
  isSubmitting: boolean
}

export default function PaymentStep({
  totalPrice,
  itemizedBreakdown,
  selection,
  specialInstructions,
  onFinalizeBooking,
  isSubmitting,
}: PaymentStepProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handlePayment = async () => {
    // 1. Finalize the booking to get the bookingId and washerId
    const bookingResult = await onFinalizeBooking()

    if (
      !bookingResult.success ||
      !bookingResult.bookingId ||
      !bookingResult.washerId
    ) {
      toast.error(
        'Failed to create booking record. Please try again or contact support.'
      )
      return
    }

    const { bookingId, washerId } = bookingResult

    // 2. Create the Stripe Checkout session
    startTransition(async () => {
      const checkoutResult = await createCheckoutSession(
        bookingId,
        washerId,
        totalPrice
      )

      if (checkoutResult.success && checkoutResult.url) {
        toast.success('Redirecting to our secure payment partner...')
        router.push(checkoutResult.url)
      } else {
        toast.error(
          checkoutResult.message ||
            'Could not initiate payment. Please try again.'
        )
        // Optionally, we could try to delete the created booking record here
        // to prevent orphaned bookings. For now, we'll leave it for manual cleanup.
      }
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-2 text-lg font-semibold'>Review & Pay</h3>
        <p className='mb-4 text-gray-600'>
          Please review your order summary below. You'll be redirected to our
          secure payment partner, Stripe, to complete your payment.
        </p>
      </div>

      {/* Order Summary (unmodified) */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {selection.date && selection.timeSlot && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Collection Details</h4>
              <div className='space-y-1 rounded-lg bg-gray-50 p-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Calendar className='h-4 w-4 text-gray-500' />
                  {formatDate(selection.date)}
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Clock className='h-4 w-4 text-gray-500' />
                  {selection.timeSlot}
                </div>
              </div>
            </div>
          )}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Services</h4>
            <div className='space-y-2'>
              {itemizedBreakdown.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between',
                    item.isSubItem && 'pl-4'
                  )}
                >
                  <span className='text-sm text-gray-600'>{item.label}</span>
                  {item.price !== null && (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        item.price < 0 ? 'text-green-600' : 'text-gray-900'
                      )}
                    >
                      {item.price < 0 ? '-' : ''}£
                      {Math.abs(item.price).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {specialInstructions && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Special Instructions</h4>
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='text-sm text-gray-700'>{specialInstructions}</p>
              </div>
            </div>
          )}
          <Separator />
          <div className='flex items-center justify-between'>
            <span className='text-lg font-semibold'>Total</span>
            <span className='text-lg font-bold text-blue-600'>
              £{totalPrice.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice (unmodified) */}
      <div className='rounded-lg border-2 border-red-200 bg-red-50 p-4'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='mt-0.5 h-6 w-6 flex-shrink-0 text-red-600' />
          <div className='space-y-2'>
            <h4 className='font-semibold text-red-800'>
              Important: Independent Contractor Service
            </h4>
            <p className='text-sm leading-relaxed text-red-700'>
              <strong>Please note:</strong> Neighbourhood Wash is a technology
              platform that connects you with independent Washers. We are not
              responsible for the laundry services themselves. Your service
              contract is directly with the assigned Washer, who is
              self-employed and not our employee.
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Warning (unmodified) */}
      <div className='rounded-lg border-2 border-orange-200 bg-orange-50 p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <svg
              className='h-6 w-6 text-orange-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <div className='space-y-2'>
            <h4 className='font-semibold text-orange-800'>
              Cancellation Policy Reminder
            </h4>
            <p className='text-sm leading-relaxed text-orange-700'>
              <strong>12-Hour Policy:</strong> Cancellations within 12 hours of
              your scheduled collection time are not eligible for a refund (full
              charge: £{totalPrice.toFixed(2)}). Free cancellation is available
              only more than 12 hours before your booking time.
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Consent Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShieldCheck className='h-5 w-5' />
            Final Step: Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-600'>
            By clicking the button below, you confirm that you have read and
            agree to our policies and that you understand the service is
            provided by an independent Washer.
          </p>
          {/* We can re-add checkboxes here if explicit consent on this page is desired */}
        </CardContent>
      </Card>

      {/* Payment Button */}
      <div className='flex justify-end'>
        <Button
          onClick={handlePayment}
          disabled={isSubmitting || isPending}
          size='lg'
          className='w-full md:w-auto'
        >
          {isSubmitting || isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Finalizing...
            </>
          ) : (
            <>
              <Lock className='mr-2 h-4 w-4' />
              Proceed to Secure Payment (£{totalPrice.toFixed(2)})
            </>
          )}
        </Button>
      </div>
      <p className='text-center text-xs text-gray-500'>
        You will be redirected to Stripe to complete your payment.
      </p>
    </div>
  )
}

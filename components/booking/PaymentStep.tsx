'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ShieldCheck,
  FileText,
  Calendar,
  Clock,
  CreditCard,
  Lock,
  AlertTriangle,
} from 'lucide-react'
import { BookingSelection } from '@/lib/pricing'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { cn } from '@/lib/utils'

interface PaymentStepProps {
  totalPrice: number
  itemizedBreakdown: Array<{
    label: string
    price: number | null
    isSubItem?: boolean
  }>
  selection: BookingSelection
  specialInstructions: string
  termsAccepted: boolean
  userAgreementAccepted: boolean
  cancellationPolicyAccepted: boolean
  onTermsChange: (accepted: boolean) => void
  onUserAgreementChange: (accepted: boolean) => void
  onCancellationPolicyChange: (accepted: boolean) => void
  onPaymentSubmit: (paymentIntentId: string) => void
  isSubmitting: boolean
}

export default function PaymentStep({
  totalPrice,
  itemizedBreakdown,
  selection,
  specialInstructions,
  termsAccepted,
  userAgreementAccepted,
  cancellationPolicyAccepted,
  onTermsChange,
  onUserAgreementChange,
  onCancellationPolicyChange,
  onPaymentSubmit,
  isSubmitting,
}: PaymentStepProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  // Additional state for new consent mechanisms
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false)
  const [pinSystemAcknowledged, setPinSystemAcknowledged] = useState(false)
  const [personalItemsAcknowledged, setPersonalItemsAcknowledged] =
    useState(false)

  const handlePaymentSubmit = async () => {
    if (!stripe || !elements) {
      return
    }

    setPaymentProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/dashboard/booking-confirmation`,
        },
        redirect: 'if_required',
      })

      if (error) {
        console.error('Payment failed:', error)
        alert(`Payment failed: ${error.message}`)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, proceed with booking creation
        onPaymentSubmit(paymentIntent.id)
      }
    } catch (error) {
      console.error('Error during payment:', error)
      alert('An error occurred during payment. Please try again.')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const allAgreementsAccepted =
    termsAccepted &&
    userAgreementAccepted &&
    cancellationPolicyAccepted &&
    liabilityAcknowledged &&
    pinSystemAcknowledged &&
    personalItemsAcknowledged

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-2 text-lg font-semibold'>Review & Pay</h3>
        <p className='mb-4 text-gray-600'>
          Please review your order and complete payment to confirm your booking.
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Collection Details */}
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

          {/* Services */}
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

          {/* Special Instructions */}
          {specialInstructions && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Special Instructions</h4>
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='text-sm text-gray-700'>{specialInstructions}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className='flex items-center justify-between'>
            <span className='text-lg font-semibold'>Total</span>
            <span className='text-lg font-bold text-blue-600'>
              £{totalPrice.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
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

      {/* Cancellation Warning */}
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

      {/* Legal Agreements & Acknowledgments */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShieldCheck className='h-5 w-5' />
            Legal Agreements & Required Acknowledgments
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4'>
            {/* Terms of Service Agreement */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='terms'
                checked={termsAccepted}
                onCheckedChange={(checked) => onTermsChange(checked as boolean)}
                className='mt-1'
              />
              <Label
                htmlFor='terms'
                className='cursor-pointer text-sm leading-relaxed'
              >
                I agree to the{' '}
                <Link
                  href='/terms-of-service'
                  target='_blank'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Terms of Service
                </Link>{' '}
                and understand that Neighbourhood Wash is a facilitating
                platform and that Washers are independent contractors.
              </Label>
            </div>

            {/* Cancellation Policy Agreement */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='cancellation-policy'
                checked={cancellationPolicyAccepted}
                onCheckedChange={(checked) =>
                  onCancellationPolicyChange(checked as boolean)
                }
                className='mt-1'
              />
              <Label
                htmlFor='cancellation-policy'
                className='cursor-pointer text-sm leading-relaxed'
              >
                I understand and accept the{' '}
                <Link
                  href='/cancellation-refund-policy'
                  target='_blank'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Cancellation & Refund Policy
                </Link>{' '}
                including the 12-hour cancellation window and associated
                charges.
              </Label>
            </div>

            {/* Community Guidelines Agreement */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='user-agreement'
                checked={userAgreementAccepted}
                onCheckedChange={(checked) =>
                  onUserAgreementChange(checked as boolean)
                }
                className='mt-1'
              />
              <Label
                htmlFor='user-agreement'
                className='cursor-pointer text-sm leading-relaxed'
              >
                I agree to follow the{' '}
                <Link
                  href='/community-guidelines'
                  target='_blank'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Community Guidelines & Acceptable Use Policy
                </Link>{' '}
                and maintain respectful conduct with my assigned Washer.
              </Label>
            </div>

            {/* Liability Limitation Acknowledgment */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='liability-limitation'
                checked={liabilityAcknowledged}
                onCheckedChange={(checked) =>
                  setLiabilityAcknowledged(checked as boolean)
                }
                className='mt-1'
              />
              <Label
                htmlFor='liability-limitation'
                className='cursor-pointer text-sm leading-relaxed'
              >
                I understand and agree to the platform's{' '}
                <Link
                  href='/terms-of-service#liability'
                  target='_blank'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Limitation of Liability
                </Link>{' '}
                and acknowledge that Neighbourhood Wash is not liable for damage
                to clothing, lost items, or service issues.
              </Label>
            </div>

            {/* PIN System Acknowledgment */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='pin-system'
                checked={pinSystemAcknowledged}
                onCheckedChange={(checked) =>
                  setPinSystemAcknowledged(checked as boolean)
                }
                className='mt-1'
              />
              <Label
                htmlFor='pin-system'
                className='cursor-pointer text-sm leading-relaxed'
              >
                I understand and agree to use the dual PIN verification system
                for secure handovers (drop-off and pick-up) and confirm that
                completing the pick-up PIN verification constitutes acceptance
                of the completed service.
              </Label>
            </div>

            {/* Personal Items Responsibility */}
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='personal-items'
                checked={personalItemsAcknowledged}
                onCheckedChange={(checked) =>
                  setPersonalItemsAcknowledged(checked as boolean)
                }
                className='mt-1'
              />
              <Label
                htmlFor='personal-items'
                className='cursor-pointer text-sm leading-relaxed'
              >
                <strong>I acknowledge that it is my responsibility</strong> to
                check all garments for personal items (keys, wallets, phones,
                jewellery, etc.) before handover. I understand that neither
                Neighbourhood Wash nor the Washer is liable for damage to
                personal items or equipment caused by items left in clothing.
              </Label>
            </div>
          </div>

          {!allAgreementsAccepted && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-4'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-amber-600' />
                <p className='text-sm font-medium text-amber-800'>
                  Please accept all agreements and acknowledgments to proceed
                  with payment
                </p>
              </div>
            </div>
          )}

          <div className='mt-4 rounded-lg bg-gray-50 p-3'>
            <p className='text-xs text-gray-600'>
              <strong>Legal Notice:</strong> By confirming this booking, you
              explicitly agree to all the above terms and acknowledge your
              understanding of the service limitations and responsibilities. All
              legal documents will open in a new tab for your review.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Secure Payment
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Stripe Payment Element */}
          <div className='rounded-lg border p-4'>
            <PaymentElement />
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePaymentSubmit}
            disabled={
              !allAgreementsAccepted || isSubmitting || paymentProcessing
            }
            className='w-full'
            size='lg'
          >
            {isSubmitting || paymentProcessing ? (
              'Processing...'
            ) : (
              <>
                <Lock className='mr-2 h-4 w-4' />
                Confirm Booking & Pay £{totalPrice.toFixed(2)}
              </>
            )}
          </Button>

          <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
            <Lock className='h-3 w-3' />
            <span>Secured by 256-bit SSL encryption via Stripe</span>
          </div>

          <div className='text-center text-xs text-gray-500'>
            <p>
              Your payment will be authorized now and captured only after
              successful completion of your laundry service via PIN
              verification.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
} from 'lucide-react'
import {
  BookingSelection,
  WeightTier,
  SpecialItem,
  AddOn,
  calculateTotal,
  getItemizedBreakdown,
} from '@/lib/pricing'
import ScheduleStep from '@/components/booking/ScheduleStep'
import ServiceStep from '@/components/booking/ServiceStep'
import DetailsStep from '@/components/booking/DetailsStep'
import PaymentStep from '@/components/booking/PaymentStep'
import { createBooking, type BookingData } from './actions'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/config'
import { createPaymentIntent } from '@/lib/stripe/actions'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

const STEPS = [
  { id: 1, name: 'Schedule', icon: Calendar },
  { id: 2, name: 'Services', icon: Clock },
  { id: 3, name: 'Details', icon: FileText },
  { id: 4, name: 'Payment', icon: CreditCard },
]

export default function NewBookingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selection, setSelection] = useState<BookingSelection>({
    weightTier: null,
    selectedItems: [],
    selectedAddOns: [],
    date: null,
    timeSlot: null,
  })
  const [totalPrice, setTotalPrice] = useState(0)
  const [itemizedBreakdown, setItemizedBreakdown] = useState<
    Array<{ label: string; price: number }>
  >([])

  // Step 3: Details state
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [accessNotes, setAccessNotes] = useState('')
  const [laundryPreferences, setLaundryPreferences] = useState<string>('')

  // Step 4: Payment state
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [userAgreementAccepted, setUserAgreementAccepted] = useState(false)
  const [cancellationPolicyAccepted, setCancellationPolicyAccepted] =
    useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentInitializing, setPaymentInitializing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Calculate total price whenever selection changes
  useEffect(() => {
    const total = calculateTotal(selection)
    const breakdown = getItemizedBreakdown(selection)
    setTotalPrice(total)
    setItemizedBreakdown(breakdown)
  }, [selection])

  // Reset payment state when moving away from payment step
  useEffect(() => {
    if (currentStep !== 4) {
      setClientSecret(null)
      setPaymentInitializing(false)
      setPaymentError(null)
    }
  }, [currentStep])

  // Create payment intent when reaching payment step
  useEffect(() => {
    if (
      currentStep === 4 &&
      totalPrice > 0 &&
      !clientSecret &&
      !paymentInitializing &&
      !paymentError
    ) {
      console.log('🔄 Initiating payment intent creation for step 4')
      setPaymentInitializing(true)
      setPaymentError(null)

      createPaymentIntent(Math.round(totalPrice * 100))
        .then((result) => {
          if (result.success && result.clientSecret) {
            console.log('✅ Payment intent created successfully')
            setClientSecret(result.clientSecret)
            setPaymentError(null)
          } else {
            console.error('❌ Failed to create payment intent:', result.error)
            const errorMessage = result.error || 'Payment initialization failed'
            setPaymentError(errorMessage)
            toast.error(
              'Could not initialize payment. Please check your Stripe configuration.'
            )
          }
        })
        .catch((error) => {
          console.error('❌ Error creating payment intent:', error)
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred'
          setPaymentError(errorMessage)
          toast.error('Could not initialize payment. Please try again.')
        })
        .finally(() => {
          setPaymentInitializing(false)
        })
    }
  }, [currentStep, totalPrice, clientSecret, paymentInitializing, paymentError])

  // Fetch user profile for laundry preferences
  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('laundry_preferences')
          .eq('id', user.id)
          .single()

        if (profile?.laundry_preferences) {
          setLaundryPreferences(profile.laundry_preferences)
        }
      }
    }

    fetchUserProfile()
  }, [])

  const updateSelection = (updates: Partial<BookingSelection>) => {
    setSelection((prev) => ({ ...prev, ...updates }))
  }

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return selection.date && selection.timeSlot
    }
    if (currentStep === 2) {
      return selection.weightTier
    }
    if (currentStep === 3) {
      // Details step - no required fields, special instructions are optional
      return true
    }
    if (currentStep === 4) {
      // Payment step - all agreements must be accepted
      return (
        termsAccepted && userAgreementAccepted && cancellationPolicyAccepted
      )
    }
    return true
  }

  const handleNextStep = () => {
    if (canProceedToNextStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePaymentSubmit = async (paymentIntentId: string) => {
    if (!selection.date || !selection.timeSlot || !selection.weightTier) {
      return
    }

    setIsSubmitting(true)

    try {
      const bookingData: BookingData = {
        date: selection.date,
        timeSlot: selection.timeSlot,
        weightTier: selection.weightTier,
        selectedItems: selection.selectedItems,
        selectedAddOns: selection.selectedAddOns,
        specialInstructions,
        stainImageUrls: uploadedImageUrls,
        accessNotes,
        totalPrice,
        paymentIntentId, // Add the payment intent ID
      }

      // Call the server action
      const result = await createBooking(bookingData)

      if (result.success && result.bookingId) {
        // Success! Redirect to confirmation page
        window.location.href = `/dashboard/booking-confirmation/${result.bookingId}`
      } else {
        // Handle error from server action
        console.error('Booking creation failed:', result.message)
        toast.error(
          result.message || 'Failed to create booking. Please try again.'
        )
      }
    } catch (error) {
      console.error('Payment submission error:', error)

      // Handle unexpected errors
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryPaymentInitialization = () => {
    setPaymentError(null)
    setClientSecret(null)
    setPaymentInitializing(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScheduleStep
            date={selection.date}
            timeSlot={selection.timeSlot}
            onDateChange={(date: Date | undefined) => updateSelection({ date })}
            onTimeSlotChange={(timeSlot: string) =>
              updateSelection({ timeSlot })
            }
          />
        )
      case 2:
        return (
          <ServiceStep
            weightTier={selection.weightTier}
            selectedItems={selection.selectedItems}
            selectedAddOns={selection.selectedAddOns}
            onWeightTierChange={(weightTier: WeightTier) =>
              updateSelection({ weightTier })
            }
            onItemsChange={(selectedItems: SpecialItem[]) =>
              updateSelection({ selectedItems })
            }
            onAddOnsChange={(selectedAddOns: AddOn[]) =>
              updateSelection({ selectedAddOns })
            }
          />
        )
      case 3:
        return (
          <DetailsStep
            specialInstructions={specialInstructions}
            onSpecialInstructionsChange={setSpecialInstructions}
            stainRemovalSelected={selection.selectedAddOns.includes(
              'stain_removal'
            )}
            uploadedImageUrls={uploadedImageUrls}
            onImageUrlsChange={setUploadedImageUrls}
            accessNotes={accessNotes}
            onAccessNotesChange={setAccessNotes}
            laundryPreferences={laundryPreferences}
          />
        )
      case 4:
        // Payment step with conditional rendering
        if (paymentInitializing) {
          return (
            <div className='flex min-h-[400px] items-center justify-center'>
              <div className='space-y-4 text-center'>
                <div className='mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'></div>
                <p className='text-gray-600'>Initializing secure payment...</p>
                <p className='text-sm text-gray-500'>
                  Please wait while we set up your payment form
                </p>
              </div>
            </div>
          )
        }

        if (paymentError) {
          return (
            <div className='flex min-h-[400px] items-center justify-center'>
              <div className='space-y-4 rounded-lg border-2 border-dashed border-red-200 bg-red-50 p-8 text-center'>
                <div className='text-red-400'>
                  <svg
                    className='mx-auto h-12 w-12'
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
                <p className='font-medium text-red-700'>Payment Setup Failed</p>
                <p className='text-sm text-red-600'>{paymentError}</p>
                <div className='space-y-2'>
                  <Button
                    onClick={retryPaymentInitialization}
                    variant='outline'
                    className='border-red-300 text-red-600 hover:bg-red-50'
                  >
                    Try Again
                  </Button>
                  <p className='text-xs text-red-500'>
                    If the problem persists, please check your Stripe
                    configuration
                  </p>
                </div>
              </div>
            </div>
          )
        }

        if (!clientSecret) {
          return (
            <div className='flex min-h-[400px] items-center justify-center'>
              <div className='space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center'>
                <div className='text-gray-400'>
                  <svg
                    className='mx-auto h-12 w-12'
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
                <p className='text-gray-600'>Payment initialization failed</p>
                <p className='text-sm text-gray-500'>
                  Please go back and try again, or refresh the page
                </p>
              </div>
            </div>
          )
        }

        // Only render PaymentStep when we have clientSecret
        return (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentStep
              totalPrice={totalPrice}
              itemizedBreakdown={itemizedBreakdown}
              selection={selection}
              specialInstructions={specialInstructions}
              termsAccepted={termsAccepted}
              userAgreementAccepted={userAgreementAccepted}
              cancellationPolicyAccepted={cancellationPolicyAccepted}
              onTermsChange={setTermsAccepted}
              onUserAgreementChange={setUserAgreementAccepted}
              onCancellationPolicyChange={setCancellationPolicyAccepted}
              onPaymentSubmit={handlePaymentSubmit}
              isSubmitting={isSubmitting}
            />
          </Elements>
        )
      default:
        return <div>Step not implemented yet</div>
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Create New Booking
          </h1>
          <p className='mt-2 text-gray-600'>
            Schedule your laundry collection and customize your service
          </p>
        </div>

        {/* Progress Steps */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className='flex items-center'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isCompleted
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isCurrent
                          ? 'border-blue-500 bg-white text-blue-500'
                          : 'border-gray-300 bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className='h-5 w-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    ) : (
                      <Icon className='h-5 w-5' />
                    )}
                  </div>
                  <div className='ml-3'>
                    <Badge variant={isCurrent ? 'default' : 'secondary'}>
                      {step.name}
                    </Badge>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className='mx-6 h-0.5 w-16 bg-gray-200' />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Left Column - Steps */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  {(() => {
                    const currentStepData = STEPS.find(
                      (step) => step.id === currentStep
                    )
                    if (currentStepData) {
                      const Icon = currentStepData.icon
                      return <Icon className='h-5 w-5' />
                    }
                    return null
                  })()}
                  Step {currentStep}:{' '}
                  {STEPS.find((step) => step.id === currentStep)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderStep()}</CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className='mt-6 flex justify-between'>
              <Button
                variant='outline'
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='h-4 w-4' />
                Previous
              </Button>
              {currentStep < 4 && (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  className='flex items-center gap-2'
                >
                  Next
                  <ArrowRight className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className='lg:col-span-1'>
            <div className='sticky top-8'>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {itemizedBreakdown.map((item, index) => (
                      <div key={index} className='flex justify-between'>
                        <span className='text-sm text-gray-600'>
                          {item.label}
                        </span>
                        <span className='text-sm font-medium'>
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className='mt-4 border-t border-gray-200 pt-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-lg font-semibold'>Total</span>
                      <span className='text-lg font-bold text-blue-600'>
                        £{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

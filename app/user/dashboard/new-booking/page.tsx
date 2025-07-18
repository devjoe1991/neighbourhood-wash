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
  calculateTotal,
  getItemizedBreakdown,
  calculateTotalWeight,
  determineWeightTier,
} from '@/lib/pricing'
import ScheduleStep from '@/components/booking/ScheduleStep'
import ServiceStep from '@/components/booking/ServiceStep'
import DetailsStep from '@/components/booking/DetailsStep'
import PaymentStep from '@/components/booking/PaymentStep'
import { createBooking, type BookingData } from './actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

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
    selectedItems: {},
    selectedAddOns: [],
    date: null,
    timeSlot: null,
    deliveryMethod: 'collection',
  })
  const [totalPrice, setTotalPrice] = useState(0)
  const [itemizedBreakdown, setItemizedBreakdown] = useState<
    Array<{ label: string; price: number | null; isSubItem?: boolean }>
  >([])

  // Step 2: Item selection state
  const [estimatedWeight, setEstimatedWeight] = useState(0)

  // Auto-calculate weight and determine tier when items change
  useEffect(() => {
    const totalWeight = calculateTotalWeight(selection.selectedItems)
    const tier = determineWeightTier(totalWeight)
    setEstimatedWeight(totalWeight)
    updateSelection({ weightTier: tier })
  }, [selection.selectedItems])

  // Step 3: Details state
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [accessNotes, setAccessNotes] = useState('')
  const [laundryPreferences, setLaundryPreferences] = useState<string>('')

  // Step 4: State is simplified
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate total price whenever selection changes
  useEffect(() => {
    const total = calculateTotal(selection)
    const breakdown = getItemizedBreakdown(selection)
    setTotalPrice(total)
    setItemizedBreakdown(breakdown)
  }, [selection])

  // All client-side payment intent logic is removed.

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
      if (selection.deliveryMethod === 'drop-off') {
        return !!selection.date
      }
      return !!(selection.date && selection.timeSlot)
    }
    if (currentStep === 2) {
      return !!selection.weightTier
    }
    if (currentStep === 3) {
      // Details step - no required fields, special instructions are optional
      return true
    }
    // This check is no longer needed as consents are handled implicitly
    // if (currentStep === 4) {
    //   // Payment step - all agreements must be accepted
    //   return (
    //     termsAccepted && userAgreementAccepted && cancellationPolicyAccepted
    //   )
    // }
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

  // New function to be passed to PaymentStep
  const handleFinalizeBooking = async (): Promise<{
    success: boolean
    bookingId?: number
    washerId?: string
  }> => {
    if (!selection.date || !selection.weightTier) {
      toast.error('Missing booking details.')
      return { success: false }
    }
    if (selection.deliveryMethod === 'collection' && !selection.timeSlot) {
      toast.error('Missing booking details.')
      return { success: false }
    }

    setIsSubmitting(true)

    try {
      // --- TEMPORARY WASHER ASSIGNMENT ---
      // This logic will be replaced by the real washer assignment system.
      // For now, we'll assign a placeholder washer.
      // IMPORTANT: THIS IS A HARDCODED PLACEHOLDER FOR DEVELOPMENT.
      const placeholderWasherId = 'd7e366e5-e490-466d-944e-a8a5f6a9b0c1' // Replace with a real washer UUID from your DB
      // --- END TEMPORARY ---

      const bookingData: BookingData = {
        date: selection.date,
        timeSlot: selection.timeSlot,
        deliveryMethod: selection.deliveryMethod,
        weightTier: selection.weightTier,
        selectedItems: selection.selectedItems,
        selectedAddOns: selection.selectedAddOns,
        specialInstructions,
        stainImageUrls: uploadedImageUrls,
        accessNotes,
        totalPrice,
        // We no longer pass a payment intent ID from the client
      }

      // We need to add the washer_id to the booking record
      const result = await createBooking({
        ...bookingData,
        washer_id: placeholderWasherId,
      })

      if (result.success && result.bookingId) {
        toast.success('Booking record created. Proceeding to payment.')
        return {
          success: true,
          bookingId: result.bookingId,
          washerId: placeholderWasherId, // Pass the assigned washer's ID back
        }
      } else {
        toast.error(
          result.message || 'Failed to create booking. Please try again.'
        )
        return { success: false }
      }
    } catch (error) {
      console.error('Finalize booking error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      return { success: false }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScheduleStep
            date={selection.date}
            timeSlot={selection.timeSlot}
            deliveryMethod={selection.deliveryMethod}
            onDateChange={(date: Date | undefined) => {
              updateSelection({ date, timeSlot: null }) // Reset time slot when date changes
            }}
            onTimeSlotChange={(timeSlot: string) =>
              updateSelection({ timeSlot })
            }
            onDeliveryMethodChange={(
              deliveryMethod: 'collection' | 'drop-off'
            ) => updateSelection({ deliveryMethod, timeSlot: null })}
          />
        )
      case 2:
        return (
          <ServiceStep
            selection={selection}
            onSelectionChange={updateSelection}
            estimatedWeight={estimatedWeight}
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
        return (
          <PaymentStep
            totalPrice={totalPrice}
            itemizedBreakdown={itemizedBreakdown}
            selection={selection}
            specialInstructions={specialInstructions}
            onFinalizeBooking={handleFinalizeBooking}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return <div>Invalid Step</div>
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
            Schedule your laundry service and customize your order
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
            <div className='mt-8 flex justify-between'>
              <Button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                variant='outline'
              >
                <ArrowLeft className='mr-2 h-4 w-4' /> Previous
              </Button>
              {currentStep < STEPS.length && (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Next <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className='lg:col-span-1'>
            <div className='sticky top-8'>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {itemizedBreakdown.map((item, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex justify-between',
                          item.isSubItem && 'pl-4'
                        )}
                      >
                        <span className='text-sm text-gray-600'>
                          {item.label}
                        </span>
                        {item.price !== null && (
                          <span
                            className={cn(
                              'text-sm font-medium',
                              item.price < 0
                                ? 'text-green-600'
                                : 'text-gray-900'
                            )}
                          >
                            {item.price < 0 ? '-' : ''}£
                            {Math.abs(item.price).toFixed(2)}
                          </span>
                        )}
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

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
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

const STEPS = [
  { id: 1, name: 'Schedule', icon: Calendar },
  { id: 2, name: 'Services', icon: Clock },
  // { id: 3, name: 'Details', icon: FileText },
  // { id: 4, name: 'Payment', icon: CreditCard },
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

  // Calculate total price whenever selection changes
  useEffect(() => {
    const total = calculateTotal(selection)
    const breakdown = getItemizedBreakdown(selection)
    setTotalPrice(total)
    setItemizedBreakdown(breakdown)
  }, [selection])

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
              <Button
                onClick={handleNextStep}
                disabled={
                  !canProceedToNextStep() || currentStep === STEPS.length
                }
                className='flex items-center gap-2'
              >
                Next
                <ArrowRight className='h-4 w-4' />
              </Button>
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

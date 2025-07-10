'use client'

import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Truck, Handshake } from 'lucide-react'
import { timeSlots } from '@/lib/pricing'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { add, isBefore, startOfHour, set } from 'date-fns'

interface ScheduleStepProps {
  date: Date | null
  timeSlot: string | null
  deliveryMethod: 'collection' | 'drop-off'
  onDateChange: (date: Date | undefined) => void
  onTimeSlotChange: (timeSlot: string) => void
  onDeliveryMethodChange: (method: 'collection' | 'drop-off') => void
}

export default function ScheduleStep({
  date,
  timeSlot,
  deliveryMethod,
  onDateChange,
  onTimeSlotChange,
  onDeliveryMethodChange,
}: ScheduleStepProps) {
  const now = new Date()
  const minimumBookingTime = add(now, { hours: 24 })

  const isDateDisabled = (day: Date) => {
    return isBefore(day, startOfHour(minimumBookingTime))
  }

  const getAvailableTimeSlots = () => {
    if (!date) return []

    const isTodaySelected =
      date.toDateString() === minimumBookingTime.toDateString()

    return timeSlots.filter((slot) => {
      if (!isTodaySelected) return true

      const [startTime] = slot.split(' - ')
      const [hour, minute] = startTime.split(':').map(Number)
      const slotDateTime = set(date, { hours: hour, minutes: minute })

      return isBefore(minimumBookingTime, slotDateTime)
    })
  }

  const availableTimeSlots = getAvailableTimeSlots()

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-4 text-lg font-semibold'>
          How would you like to handle your laundry?
        </h3>
        <RadioGroup
          defaultValue='collection'
          value={deliveryMethod}
          onValueChange={onDeliveryMethodChange}
          className='grid grid-cols-1 gap-4 md:grid-cols-2'
        >
          <Label
            htmlFor='collection'
            className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-blue-500 ${
              deliveryMethod === 'collection'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <RadioGroupItem value='collection' id='collection' className='sr-only' />
            <Truck className='mb-2 h-8 w-8 text-blue-600' />
            <span className='font-semibold'>We Collect</span>
            <span className='text-sm text-gray-500'>
              + £4.99 Collection Fee
            </span>
          </Label>
          <Label
            htmlFor='drop-off'
            className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-blue-500 ${
              deliveryMethod === 'drop-off'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <RadioGroupItem value='drop-off' id='drop-off' className='sr-only' />
            <Handshake className='mb-2 h-8 w-8 text-blue-600' />
            <span className='font-semibold'>You Drop-off</span>
            <span className='text-sm text-gray-500'>
              You drop it off to a local washer
            </span>
          </Label>
        </RadioGroup>
      </div>

      <div>
        <h3 className='mb-2 text-lg font-semibold'>
          {deliveryMethod === 'collection'
            ? 'When would you like your laundry collected?'
            : 'When would you like to drop-off your laundry?'}
        </h3>
        <p className='mb-4 text-gray-600'>
          {deliveryMethod === 'collection'
            ? "Choose a date and time slot. We'll match you with a washer."
            : 'Select a date. Drop-off times can be coordinated directly with your assigned washer.'}
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Card>
          <CardContent className='p-6'>
            <Label className='mb-3 block text-base font-medium'>
              {deliveryMethod === 'collection' ? 'Collection Date' : 'Drop-off Date'}
            </Label>
            <div className='flex justify-center'>
              <Calendar
                mode='single'
                selected={date || undefined}
                onSelect={onDateChange}
                disabled={isDateDisabled}
                className='rounded-md border'
                initialFocus
              />
            </div>
            <p className='mt-2 text-sm text-gray-500'>
              Note: Bookings must be made at least 24 hours in advance.
            </p>
          </CardContent>
        </Card>

        {deliveryMethod === 'collection' && (
          <Card>
            <CardContent className='p-6'>
              <Label className='mb-3 block text-base font-medium'>
                <Clock className='mr-2 inline h-4 w-4' />
                Collection Time
              </Label>
              <Select
                value={timeSlot || ''}
                onValueChange={onTimeSlotChange}
                disabled={!date || availableTimeSlots.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a time slot' />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {date && availableTimeSlots.length === 0 && (
                 <p className='mt-2 text-sm text-red-500'>
                   No available time slots for the selected date. Please choose a future date.
                 </p>
              )}
              <p className='mt-3 text-sm text-gray-600'>
                Your Washer will be assigned 12 hours before collection.
              </p>
            </CardContent>
          </Card>
        )}
         {deliveryMethod === 'drop-off' && (
          <Card className='flex flex-col justify-center bg-blue-50'>
            <CardContent className='p-6 text-center'>
                <Handshake className='mx-auto mb-3 h-8 w-8 text-blue-600' />
                <h4 className='font-semibold text-blue-800'>Flexible Drop-off</h4>
                <p className='mt-2 text-sm text-blue-700'>
                    Once a washer is assigned to your booking, you can coordinate a suitable drop-off time and location directly with them via our chat.
                </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

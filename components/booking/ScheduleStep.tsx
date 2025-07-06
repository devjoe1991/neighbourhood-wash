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
import { Badge } from '@/components/ui/badge'
import { Clock, Truck } from 'lucide-react'
import { timeSlots } from '@/lib/pricing'

interface ScheduleStepProps {
  date: Date | null
  timeSlot: string | null
  onDateChange: (date: Date | undefined) => void
  onTimeSlotChange: (timeSlot: string) => void
}

export default function ScheduleStep({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
}: ScheduleStepProps) {
  const getEstimatedDelivery = (
    collectionDate: Date,
    collectionTime: string
  ) => {
    const delivery = new Date(collectionDate)
    delivery.setDate(delivery.getDate() + 1)

    // Simple logic: if collection is in the morning, delivery is evening next day
    // If collection is afternoon/evening, delivery is next day afternoon
    if (collectionTime.includes('9:00 AM')) {
      return 'Tomorrow, 5:00 PM - 8:00 PM'
    } else {
      return 'Tomorrow, 1:00 PM - 4:00 PM'
    }
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-2 text-lg font-semibold'>
          When would you like your laundry collected?
        </h3>
        <p className='mb-4 text-gray-600'>
          Choose a date and time slot that works for you. We'll match you with
          an available Washer.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Calendar */}
        <Card>
          <CardContent className='p-6'>
            <Label className='mb-3 block text-base font-medium'>
              Collection Date
            </Label>
            <Calendar
              mode='single'
              selected={date || undefined}
              onSelect={onDateChange}
              disabled={isDateDisabled}
              className='rounded-md border'
            />
          </CardContent>
        </Card>

        {/* Time Slot Selection */}
        <div className='space-y-4'>
          <Card>
            <CardContent className='p-6'>
              <Label className='mb-3 block text-base font-medium'>
                <Clock className='mr-2 inline h-4 w-4' />
                Collection Time
              </Label>
              <Select value={timeSlot || ''} onValueChange={onTimeSlotChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a time slot' />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Estimated Delivery */}
          {date && timeSlot && (
            <Card className='border-blue-200 bg-blue-50'>
              <CardContent className='p-6'>
                <div className='mb-2 flex items-center gap-2'>
                  <Truck className='h-4 w-4 text-blue-600' />
                  <Label className='text-base font-medium text-blue-900'>
                    Estimated Delivery
                  </Label>
                </div>
                <Badge
                  variant='secondary'
                  className='bg-blue-100 text-blue-800'
                >
                  {getEstimatedDelivery(date, timeSlot)}
                </Badge>
                <p className='mt-2 text-sm text-blue-700'>
                  Your Washer will be assigned 12 hours before collection
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

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
import { Clock } from 'lucide-react'
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
            <p className='mt-3 text-sm text-gray-600'>
              Your Washer will be assigned 12 hours before collection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

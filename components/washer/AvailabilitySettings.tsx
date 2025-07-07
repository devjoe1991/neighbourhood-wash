'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock } from 'lucide-react'

interface AvailabilitySettingsProps {
  value: Record<string, { start: string; end: string } | null>
  onChange: (
    schedule: Record<string, { start: string; end: string } | null>
  ) => void
}

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
]

const timeSlots = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
]

export default function AvailabilitySettings({
  value,
  onChange,
}: AvailabilitySettingsProps) {
  const handleDayToggle = (dayId: string, checked: boolean) => {
    if (checked) {
      // Enable day with default hours
      onChange({
        ...value,
        [dayId]: { start: '09:00', end: '17:00' },
      })
    } else {
      // Disable day
      onChange({
        ...value,
        [dayId]: null,
      })
    }
  }

  const handleTimeChange = (
    dayId: string,
    type: 'start' | 'end',
    time: string
  ) => {
    const currentDay = value[dayId]
    if (currentDay) {
      onChange({
        ...value,
        [dayId]: {
          ...currentDay,
          [type]: time,
        },
      })
    }
  }

  const activeDaysCount = Object.values(value).filter(
    (day) => day !== null
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Availability Schedule
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Set your weekly availability for accepting bookings
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {daysOfWeek.map((day) => {
            const daySchedule = value[day.id]
            const isAvailable = daySchedule !== null

            return (
              <div
                key={day.id}
                className='flex items-center space-x-4 rounded-lg border p-4'
              >
                <div className='flex items-center space-x-3'>
                  <Checkbox
                    id={day.id}
                    checked={isAvailable}
                    onCheckedChange={(checked) =>
                      handleDayToggle(day.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={day.id}
                    className='min-w-[100px] cursor-pointer font-medium'
                  >
                    {day.label}
                  </Label>
                </div>

                {isAvailable && (
                  <div className='flex items-center space-x-2'>
                    <Clock className='h-4 w-4 text-gray-500' />
                    <Select
                      value={daySchedule?.start || '09:00'}
                      onValueChange={(time) =>
                        handleTimeChange(day.id, 'start', time)
                      }
                    >
                      <SelectTrigger className='w-24'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className='text-gray-500'>to</span>

                    <Select
                      value={daySchedule?.end || '17:00'}
                      onValueChange={(time) =>
                        handleTimeChange(day.id, 'end', time)
                      }
                    >
                      <SelectTrigger className='w-24'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isAvailable && (
                  <span className='text-sm text-gray-500'>Not available</span>
                )}
              </div>
            )
          })}
        </div>

        {activeDaysCount === 0 && (
          <div className='mt-4 rounded-lg bg-amber-50 p-4'>
            <p className='text-sm text-amber-800'>
              ⚠️ You must be available at least one day per week to receive
              bookings
            </p>
          </div>
        )}

        {activeDaysCount > 0 && (
          <div className='mt-4 rounded-lg bg-green-50 p-4'>
            <p className='text-sm text-green-800'>
              ✅ You're available {activeDaysCount} day
              {activeDaysCount > 1 ? 's' : ''} per week
            </p>
          </div>
        )}

        <div className='mt-4 rounded-lg bg-blue-50 p-4'>
          <h4 className='mb-2 font-medium text-blue-900'>Availability Tips:</h4>
          <ul className='space-y-1 text-sm text-blue-800'>
            <li>• More availability = more booking opportunities</li>
            <li>• Weekend availability is often in high demand</li>
            <li>• You can always adjust your schedule later</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

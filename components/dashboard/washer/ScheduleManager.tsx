'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Calendar, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'

interface TimeSlot {
  start_time: string
  end_time: string
  is_available: boolean
}

interface DaySchedule {
  day_of_week: number
  slots: TimeSlot[]
}

interface ScheduleManagerProps {
  washerId: string
  currentSchedule: any
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export function ScheduleManager({ washerId, currentSchedule }: ScheduleManagerProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    initializeSchedule()
  }, [currentSchedule])

  const initializeSchedule = () => {
    // Initialize with default schedule or load existing
    const defaultSchedule: DaySchedule[] = DAYS_OF_WEEK.map((_, index) => ({
      day_of_week: index,
      slots: [
        { start_time: '09:00', end_time: '17:00', is_available: true }
      ]
    }))

    if (currentSchedule && typeof currentSchedule === 'object') {
      // Parse existing schedule
      setSchedule(defaultSchedule) // For now, use default
    } else {
      setSchedule(defaultSchedule)
    }
  }

  const updateDayAvailability = (dayIndex: number, isAvailable: boolean) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex 
        ? { ...day, slots: day.slots.map(slot => ({ ...slot, is_available: isAvailable })) }
        : day
    ))
    setHasChanges(true)
  }

  const addTimeSlot = (dayIndex: number) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex 
        ? { 
            ...day, 
            slots: [...day.slots, { start_time: '09:00', end_time: '17:00', is_available: true }]
          }
        : day
    ))
    setHasChanges(true)
  }

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex 
        ? {
            ...day,
            slots: day.slots.map((slot, idx) => 
              idx === slotIndex ? { ...slot, [field]: value } : slot
            )
          }
        : day
    ))
    setHasChanges(true)
  }

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex 
        ? { ...day, slots: day.slots.filter((_, idx) => idx !== slotIndex) }
        : day
    ))
    setHasChanges(true)
  }

  const saveSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/washer/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          washerId,
          schedule: schedule.reduce((acc, day) => {
            acc[day.day_of_week] = day.slots
            return acc
          }, {} as Record<number, TimeSlot[]>)
        })
      })
      
      if (response.ok) {
        setHasChanges(false)
        setEditingDay(null)
      }
    } catch (error) {
      console.error('Failed to save schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDayAvailability = (dayIndex: number) => {
    const day = schedule.find(d => d.day_of_week === dayIndex)
    return day?.slots.some(slot => slot.is_available) || false
  }

  const getTotalHours = (slots: TimeSlot[]) => {
    return slots.reduce((total, slot) => {
      if (!slot.is_available) return total
      
      const start = new Date(`2000-01-01T${slot.start_time}:00`)
      const end = new Date(`2000-01-01T${slot.end_time}:00`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      
      return total + hours
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Schedule & Availability</span>
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    initializeSchedule()
                    setHasChanges(false)
                    setEditingDay(null)
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={saveSchedule}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Set your availability for each day of the week
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Weekly Schedule */}
      <div className="grid gap-4">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const daySchedule = schedule.find(d => d.day_of_week === dayIndex)
          const isAvailable = getDayAvailability(dayIndex)
          const totalHours = daySchedule ? getTotalHours(daySchedule.slots) : 0
          const isEditing = editingDay === dayIndex

          return (
            <Card key={dayIndex} className={isAvailable ? 'border-green-200' : 'border-gray-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={(checked) => updateDayAvailability(dayIndex, checked)}
                      />
                      <Label className="font-medium">{dayName}</Label>
                    </div>
                    {isAvailable && (
                      <Badge variant="outline" className="text-xs">
                        {totalHours}h available
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAvailable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDay(isEditing ? null : dayIndex)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {isAvailable && (
                <CardContent className="pt-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      {daySchedule?.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start_time', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end_time', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          />
                          {daySchedule.slots.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(dayIndex)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Time Slot
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule?.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <Badge variant={slot.is_available ? "default" : "secondary"} className="text-xs">
                            {slot.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Set all days to available 9-5
                const newSchedule = DAYS_OF_WEEK.map((_, index) => ({
                  day_of_week: index,
                  slots: [{ start_time: '09:00', end_time: '17:00', is_available: true }]
                }))
                setSchedule(newSchedule)
                setHasChanges(true)
              }}
            >
              Set Standard Hours (9-5)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Set weekdays only
                const newSchedule = DAYS_OF_WEEK.map((_, index) => ({
                  day_of_week: index,
                  slots: [{ 
                    start_time: '09:00', 
                    end_time: '17:00', 
                    is_available: index >= 1 && index <= 5 // Monday to Friday
                  }]
                }))
                setSchedule(newSchedule)
                setHasChanges(true)
              }}
            >
              Weekdays Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
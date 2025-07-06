'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { submitWashRequest } from './actions'

export default function RequestWashPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [services, setServices] = useState<string[]>([])
  const [needsCollection, setNeedsCollection] = useState(false)
  const [preferredDateTime, setPreferredDateTime] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const handleServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setServices((prev) => [...prev, service])
    } else {
      setServices((prev) => prev.filter((s) => s !== service))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const formData = {
        services,
        needsCollection,
        preferredDateTime,
        specialInstructions,
      }

      const result = await submitWashRequest(formData)

      if (result.success) {
        setSubmitMessage(result.message)
        // Reset form
        setServices([])
        setNeedsCollection(false)
        setPreferredDateTime('')
        setSpecialInstructions('')
      }
    } catch {
      setSubmitMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            New Laundry Request
          </h1>
          <p className='text-muted-foreground'>
            Tell us what you need, and we'll automatically match you with the
            best available washer in your neighbourhood.
          </p>
        </div>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Services Needed */}
            <div className='space-y-3'>
              <Label className='text-base font-medium'>Services Needed</Label>
              <div className='space-y-2'>
                {['Wash', 'Dry', 'Iron'].map((service) => (
                  <div key={service} className='flex items-center space-x-2'>
                    <Checkbox
                      id={service.toLowerCase()}
                      checked={services.includes(service.toLowerCase())}
                      onCheckedChange={(checked) =>
                        handleServiceChange(
                          service.toLowerCase(),
                          checked as boolean
                        )
                      }
                    />
                    <Label
                      htmlFor={service.toLowerCase()}
                      className='cursor-pointer text-sm font-normal'
                    >
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Collection Service */}
            <div className='space-y-3'>
              <Label className='text-base font-medium'>
                Collection Service
              </Label>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='collection'
                  checked={needsCollection}
                  onCheckedChange={(checked) =>
                    setNeedsCollection(checked as boolean)
                  }
                />
                <Label
                  htmlFor='collection'
                  className='cursor-pointer text-sm font-normal'
                >
                  I need my laundry collected and delivered
                </Label>
              </div>
            </div>

            {/* Scheduling */}
            <div className='space-y-3'>
              <Label htmlFor='datetime' className='text-base font-medium'>
                Preferred Date & Time
              </Label>
              <Textarea
                id='datetime'
                placeholder='e.g., Tomorrow afternoon, Friday anytime, Next week...'
                value={preferredDateTime}
                onChange={(e) => setPreferredDateTime(e.target.value)}
                className='min-h-[80px]'
              />
            </div>

            {/* Special Instructions */}
            <div className='space-y-3'>
              <Label htmlFor='instructions' className='text-base font-medium'>
                Special Instructions
              </Label>
              <Textarea
                id='instructions'
                placeholder='Any special instructions, allergies, or product preferences...'
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className='min-h-[100px]'
              />
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting || services.length === 0}
            >
              {isSubmitting ? 'Finding Your Washer...' : 'Find My Washer'}
            </Button>

            {/* Submit Message */}
            {submitMessage && (
              <div className='rounded-md bg-green-50 p-4 text-sm text-green-800'>
                {submitMessage}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

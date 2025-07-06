'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Info } from 'lucide-react'

interface AreaSettingsProps {
  value: number
  onChange: (radius: number) => void
}

export default function AreaSettings({ value, onChange }: AreaSettingsProps) {
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const radius = parseInt(e.target.value) || 0
    // Limit to reasonable range
    if (radius >= 0 && radius <= 25) {
      onChange(radius)
    }
  }

  const getRadiusStatus = (radius: number) => {
    if (radius === 0) {
      return {
        color: 'text-red-600',
        message: '⚠️ Service area must be at least 1 mile to receive bookings',
      }
    } else if (radius <= 3) {
      return {
        color: 'text-blue-600',
        message: '🏠 Local service area - ideal for nearby customers',
      }
    } else if (radius <= 8) {
      return {
        color: 'text-green-600',
        message:
          '🌆 Standard service area - good coverage and travel time balance',
      }
    } else if (radius <= 15) {
      return {
        color: 'text-orange-600',
        message:
          '🚗 Extended service area - more opportunities, longer travel times',
      }
    } else {
      return {
        color: 'text-purple-600',
        message:
          '✈️ Wide service area - maximum opportunities, significant travel',
      }
    }
  }

  const radiusStatus = getRadiusStatus(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          Service Area
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Define how far you're willing to travel for collections and deliveries
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='radius'>Service Radius (miles)</Label>
            <div className='flex items-center space-x-2'>
              <Input
                id='radius'
                type='number'
                min='0'
                max='25'
                value={value}
                onChange={handleRadiusChange}
                className='w-32'
                placeholder='5'
              />
              <span className='text-sm text-gray-500'>miles</span>
            </div>
          </div>

          <div
            className={`rounded-lg p-4 ${value === 0 ? 'bg-red-50' : 'bg-gray-50'}`}
          >
            <p className={`text-sm font-medium ${radiusStatus.color}`}>
              {radiusStatus.message}
            </p>
          </div>

          <div className='rounded-lg bg-blue-50 p-4'>
            <div className='flex items-start gap-3'>
              <Info className='mt-0.5 h-5 w-5 text-blue-600' />
              <div>
                <h4 className='mb-2 font-medium text-blue-900'>
                  Service Area Guidelines:
                </h4>
                <ul className='space-y-1 text-sm text-blue-800'>
                  <li>
                    • <strong>1-3 miles:</strong> Perfect for local
                    neighbourhood service
                  </li>
                  <li>
                    • <strong>4-8 miles:</strong> Good balance of coverage and
                    convenience
                  </li>
                  <li>
                    • <strong>9-15 miles:</strong> Extended reach for more
                    bookings
                  </li>
                  <li>
                    • <strong>16+ miles:</strong> Maximum coverage, longer
                    travel times
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {value > 0 && (
            <div className='rounded-lg bg-green-50 p-4'>
              <p className='text-sm text-green-800'>
                ✅ You'll serve customers within a {value}-mile radius of your
                location
              </p>
            </div>
          )}

          <div className='rounded-lg bg-amber-50 p-4'>
            <h4 className='mb-2 font-medium text-amber-900'>
              Important Notes:
            </h4>
            <ul className='space-y-1 text-sm text-amber-800'>
              <li>• Larger service areas mean more booking opportunities</li>
              <li>• Consider travel time and fuel costs in your pricing</li>
              <li>• You can adjust your service area at any time</li>
              <li>• Distance is calculated from your registered address</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

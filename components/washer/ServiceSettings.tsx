'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { WashingMachine, Shirt, Droplets, Truck } from 'lucide-react'

interface ServiceSettingsProps {
  value: string[]
  onChange: (services: string[]) => void
}

const availableServices = [
  {
    id: 'wash_dry',
    label: 'Wash & Dry',
    description: 'Standard washing and drying service',
    icon: <WashingMachine className='h-5 w-5 text-blue-600' />,
  },
  {
    id: 'ironing',
    label: 'Ironing Service',
    description: 'Professional ironing and pressing',
    icon: <Shirt className='h-5 w-5 text-green-600' />,
  },
  {
    id: 'stain_removal',
    label: 'Stain Removal',
    description: 'Specialized stain treatment',
    icon: <Droplets className='h-5 w-5 text-purple-600' />,
  },
  {
    id: 'collection_delivery',
    label: 'Collection & Delivery',
    description: 'Pick up and drop off service',
    icon: <Truck className='h-5 w-5 text-orange-600' />,
  },
]

export default function ServiceSettings({
  value,
  onChange,
}: ServiceSettingsProps) {
  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      // Add service if not already included
      if (!value.includes(serviceId)) {
        onChange([...value, serviceId])
      }
    } else {
      // Remove service
      onChange(value.filter((id) => id !== serviceId))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <WashingMachine className='h-5 w-5' />
          My Services
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Select the services you want to offer to customers
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {availableServices.map((service) => (
            <div
              key={service.id}
              className='flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-gray-50'
            >
              <Checkbox
                id={service.id}
                checked={value.includes(service.id)}
                onCheckedChange={(checked) =>
                  handleServiceToggle(service.id, checked as boolean)
                }
                className='mt-1'
              />
              <div className='flex-1'>
                <Label
                  htmlFor={service.id}
                  className='flex cursor-pointer items-center gap-2 font-medium'
                >
                  {service.icon}
                  {service.label}
                </Label>
                <p className='mt-1 text-sm text-gray-600'>
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {value.length === 0 && (
          <div className='mt-4 rounded-lg bg-amber-50 p-4'>
            <p className='text-sm text-amber-800'>
              ⚠️ You must select at least one service to receive bookings
            </p>
          </div>
        )}

        {value.length > 0 && (
          <div className='mt-4 rounded-lg bg-green-50 p-4'>
            <p className='text-sm text-green-800'>
              ✅ You offer {value.length} service{value.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

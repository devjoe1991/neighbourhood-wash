'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookingSelection } from '@/lib/pricing'
import { Receipt, Calendar, Clock } from 'lucide-react'

interface PriceSummaryProps {
  totalPrice: number
  itemizedBreakdown: Array<{ label: string; price: number }>
  selection: BookingSelection
}

export default function PriceSummary({
  totalPrice,
  itemizedBreakdown,
  selection,
}: PriceSummaryProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className='sticky top-8'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='h-5 w-5' />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Schedule Summary */}
          {selection.date && selection.timeSlot && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Collection Details</h4>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='h-4 w-4' />
                  {formatDate(selection.date)}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Clock className='h-4 w-4' />
                  {selection.timeSlot}
                </div>
              </div>
              <Separator />
            </div>
          )}

          {/* Service Summary */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Services</h4>
            <div className='space-y-2'>
              {itemizedBreakdown.length > 0 ? (
                itemizedBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between'
                  >
                    <span className='text-sm text-gray-600'>{item.label}</span>
                    <span
                      className={`text-sm font-medium ${
                        item.price < 0 ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {item.price < 0 ? '-' : ''}£
                      {Math.abs(item.price).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className='text-sm text-gray-500 italic'>
                  No services selected yet
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <Separator />
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-lg font-semibold'>Total</span>
              <span className='text-lg font-bold text-blue-600'>
                £{totalPrice.toFixed(2)}
              </span>
            </div>
            {totalPrice > 0 && (
              <div className='text-xs text-gray-500'>
                Includes collection & delivery
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className='pt-2'>
            {totalPrice > 0 ? (
              <Badge className='w-full bg-green-100 text-green-800 hover:bg-green-100'>
                Ready to proceed
              </Badge>
            ) : (
              <Badge variant='secondary' className='w-full'>
                Select services to continue
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

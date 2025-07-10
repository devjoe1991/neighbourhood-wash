'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Package,
  PoundSterling,
  ArrowRight,
  UserCheck,
} from 'lucide-react'
import { BookingRecord } from '@/app/user/dashboard/my-bookings/actions'

interface BookingListItemProps {
  booking: BookingRecord
}

export default function BookingListItem({ booking }: BookingListItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_washer_assignment':
        return 'secondary' // Gray/blue
      case 'washer_assigned':
        return 'default' // Blue
      case 'in_progress':
        return 'outline' // White with border
      case 'completed':
        return 'default' // Green
      case 'cancelled_by_user':
      case 'cancelled_by_washer':
        return 'destructive' // Red
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_washer_assignment':
        return 'Awaiting Washer'
      case 'washer_assigned':
        return 'Washer Assigned'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled_by_user':
      case 'cancelled_by_washer':
        return 'Cancelled'
      default:
        return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const getServicesSummary = (servicesConfig: Record<string, unknown>) => {
    if (!servicesConfig) return 'Standard Service'

    const parts: string[] = []

    // Base service
    if (
      servicesConfig.baseService &&
      typeof servicesConfig.baseService === 'object'
    ) {
      const baseService = servicesConfig.baseService as { label: string }
      if (baseService.label) {
        parts.push(baseService.label)
      }
    }

    // Special items count
    if (
      Array.isArray(servicesConfig.selectedItems) &&
      servicesConfig.selectedItems.length > 0
    ) {
      const count = servicesConfig.selectedItems.length
      parts.push(`${count} Special Item${count > 1 ? 's' : ''}`)
    }

    // Add-ons
    if (
      Array.isArray(servicesConfig.selectedAddOns) &&
      servicesConfig.selectedAddOns.length > 0
    ) {
      const addOns = servicesConfig.selectedAddOns.map((addon: unknown) => {
        if (typeof addon === 'object' && addon !== null) {
          const addonObj = addon as { label?: string; key?: string }
          return addonObj.label || addonObj.key || 'Unknown'
        }
        return 'Unknown'
      })
      parts.push(...addOns)
    }

    return parts.join(', ') || 'Standard Service'
  }

  // const getStatusProps = (status: string) => {
  //   switch (status) {
  //     case 'pending_washer_assignment':
  //       return {
  //         text: 'Awaiting Washer',
  //         color: 'bg-yellow-100 text-yellow-800',
  //         icon: <UserCheck className='h-4 w-4' />,
  //       }
  //     case 'washer_assigned':
  //       return {
  //         text: 'Washer Assigned',
  //         color: 'bg-blue-100 text-blue-800',
  //         icon: null,
  //       }
  //     case 'in_progress':
  //       return {
  //         text: 'In Progress',
  //         color: 'bg-green-100 text-green-800',
  //         icon: null,
  //       }
  //     case 'completed':
  //       return {
  //         text: 'Completed',
  //         color: 'bg-green-100 text-green-800',
  //         icon: null,
  //       }
  //     case 'cancelled_by_user':
  //     case 'cancelled_by_washer':
  //       return {
  //         text: 'Cancelled',
  //         color: 'bg-red-100 text-red-800',
  //         icon: null,
  //       }
  //     default:
  //       return { text: status, color: 'bg-gray-100 text-gray-800', icon: null }
  //   }
  // }

  // const getActionProps = (status: string, bookingId: number) => {
  //   switch (status) {
  //     case 'pending_washer_assignment':
  //     case 'washer_assigned':
  //       return {
  //         text: 'Track Booking',
  //         href: `/user/dashboard/my-bookings/${bookingId}`,
  //         icon: <ArrowRight className='h-3 w-3' />,
  //       }
  //     case 'in_progress':
  //       return {
  //         text: 'View Details',
  //         href: `/user/dashboard/my-bookings/${bookingId}`,
  //         icon: <ArrowRight className='h-3 w-3' />,
  //       }
  //     case 'completed':
  //       return {
  //         text: 'View Details',
  //         href: `/user/dashboard/my-bookings/${bookingId}`,
  //         icon: <ArrowRight className='h-3 w-3' />,
  //       }
  //     case 'cancelled_by_user':
  //     case 'cancelled_by_washer':
  //       return {
  //         text: 'View Details',
  //         href: `/user/dashboard/my-bookings/${bookingId}`,
  //         icon: <ArrowRight className='h-3 w-3' />,
  //       }
  //     default:
  //       return { text: 'View Details', href: `/user/dashboard/my-bookings/${bookingId}`, icon: <ArrowRight className='h-3 w-3' /> }
  //   }
  // }

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar className='h-4 w-4' />
              {formatDate(booking.collection_date)}
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Clock className='h-4 w-4' />
              {booking.collection_time_slot}
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-gray-500' />
            <span className='text-sm text-gray-700'>
              {getServicesSummary(booking.services_config)}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <PoundSterling className='h-4 w-4 text-gray-500' />
              <span className='text-lg font-semibold'>
                £{booking.total_price.toFixed(2)}
              </span>
            </div>

            <Link href={`/user/dashboard/my-bookings/${booking.id}`}>
              <Button variant='outline' size='sm' className='gap-2'>
                View Details
                <ArrowRight className='h-3 w-3' />
              </Button>
            </Link>
          </div>

          {booking.special_instructions && (
            <div className='rounded-lg bg-gray-50 p-2'>
              <p className='text-xs text-gray-600'>
                <strong>Note:</strong>{' '}
                {booking.special_instructions.slice(0, 100)}
                {booking.special_instructions.length > 100 && '...'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

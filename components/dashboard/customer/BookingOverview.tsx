'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MessageCircle,
  Package,
  Truck,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useBookingStatusUpdates } from '@/lib/hooks/use-realtime'

interface ActiveBooking {
  id: string
  status: string
  service_type: string
  requested_date: string
  requested_time_start?: string
  pickup_address: any
  total_price: number
  washer?: {
    id: string
    name: string
    rating: number
    phone?: string
  }
  estimated_completion?: string
  progress_percentage: number
}

export default function BookingOverview() {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch active booking
  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const response = await fetch('/api/customer/active-booking')
        if (response.ok) {
          const data = await response.json()
          setActiveBooking(data.booking)
        }
      } catch (error) {
        console.error('Error fetching active booking:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveBooking()
  }, [])

  // Handle real-time updates for the active booking
  useBookingStatusUpdates(activeBooking?.id || '', (event) => {
    if (activeBooking && event.bookingId === activeBooking.id) {
      setActiveBooking(prev => prev ? {
        ...prev,
        status: event.newStatus,
        progress_percentage: getProgressPercentage(event.newStatus)
      } : null)
    }
  })

  const getProgressPercentage = (status: string): number => {
    const statusMap: Record<string, number> = {
      'pending': 10,
      'assigned': 25,
      'confirmed': 40,
      'in_progress': 60,
      'pickup_complete': 70,
      'washing': 80,
      'ready_for_delivery': 90,
      'out_for_delivery': 95,
      'completed': 100
    }
    return statusMap[status] || 0
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-500',
      'assigned': 'bg-blue-500',
      'confirmed': 'bg-green-500',
      'in_progress': 'bg-purple-500',
      'pickup_complete': 'bg-indigo-500',
      'washing': 'bg-cyan-500',
      'ready_for_delivery': 'bg-orange-500',
      'out_for_delivery': 'bg-red-500',
      'completed': 'bg-green-600'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'pending': <Clock className="h-4 w-4" />,
      'assigned': <User className="h-4 w-4" />,
      'confirmed': <CheckCircle className="h-4 w-4" />,
      'in_progress': <Package className="h-4 w-4" />,
      'pickup_complete': <Truck className="h-4 w-4" />,
      'washing': <Package className="h-4 w-4" />,
      'ready_for_delivery': <Package className="h-4 w-4" />,
      'out_for_delivery': <Truck className="h-4 w-4" />,
      'completed': <CheckCircle className="h-4 w-4" />
    }
    return iconMap[status] || <Clock className="h-4 w-4" />
  }

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Finding Washer',
      'assigned': 'Washer Assigned',
      'confirmed': 'Confirmed',
      'in_progress': 'Service Started',
      'pickup_complete': 'Items Collected',
      'washing': 'Being Washed',
      'ready_for_delivery': 'Ready for Delivery',
      'out_for_delivery': 'Out for Delivery',
      'completed': 'Completed'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeBooking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No active bookings
            </h3>
            <p className="text-gray-600 mb-4">
              Ready to book your next laundry service?
            </p>
            <Button asChild>
              <Link href="/user/dashboard/new-booking">
                Book Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Booking</CardTitle>
          <Badge variant="outline" className="flex items-center space-x-1">
            {getStatusIcon(activeBooking.status)}
            <span>{formatStatus(activeBooking.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{activeBooking.progress_percentage}%</span>
          </div>
          <Progress 
            value={activeBooking.progress_percentage} 
            className="h-2"
          />
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{new Date(activeBooking.requested_date).toLocaleDateString()}</span>
              {activeBooking.requested_time_start && (
                <>
                  <Clock className="h-4 w-4 text-gray-500 ml-2" />
                  <span>{activeBooking.requested_time_start}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="truncate">
                {activeBooking.pickup_address?.address || 'Address not specified'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-gray-500" />
              <span>{activeBooking.service_type}</span>
            </div>
          </div>

          {/* Washer Info */}
          {activeBooking.washer && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{activeBooking.washer.name}</span>
                <div className="flex items-center">
                  <span className="text-sm text-yellow-600">★</span>
                  <span className="text-sm text-gray-600 ml-1">
                    {activeBooking.washer.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {activeBooking.washer.phone && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-lg font-semibold">
            £{activeBooking.total_price.toFixed(2)}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/user/dashboard/my-bookings/${activeBooking.id}`}>
                View Details
              </Link>
            </Button>
            {activeBooking.status === 'confirmed' && (
              <Button size="sm" asChild>
                <Link href={`/user/dashboard/my-bookings/${activeBooking.id}/track`}>
                  Track Live
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Estimated Completion */}
        {activeBooking.estimated_completion && (
          <div className="text-sm text-gray-600 text-center">
            Estimated completion: {new Date(activeBooking.estimated_completion).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
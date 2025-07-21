'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import Link from 'next/link'

interface HistoricalBooking {
  id: string
  status: string
  service_type: string
  total_price: number
  created_at: string
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<HistoricalBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookingHistory = async () => {
      try {
        const response = await fetch('/api/customer/booking-history?limit=10')
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
        }
      } catch (error) {
        console.error('Error fetching booking history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookingHistory()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No booking history yet
            </h3>
            <p className="text-gray-600 mb-4">
              Your completed and cancelled bookings will appear here
            </p>
            <Button asChild>
              <Link href="/user/dashboard/new-booking">
                Book Your First Service
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{booking.service_type}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">£{booking.total_price.toFixed(2)}</div>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
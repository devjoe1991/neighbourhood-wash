'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Search,
  Filter,
  ArrowRight,
  Eye,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRealTimeEvent } from '@/lib/hooks/use-realtime'

interface Booking {
  id: string
  status: string
  service_type: string
  service_description?: string
  requested_date: string
  requested_time_start?: string
  pickup_address: any
  total_price: number
  created_at: string
  washer?: {
    id: string
    name: string
    rating: number
  }
  unread_messages?: number
}

interface ActiveBookingsProps {
  showAll?: boolean
  limit?: number
}

export default function ActiveBookings({ showAll = false, limit = 5 }: ActiveBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams({
          active_only: showAll ? 'false' : 'true',
          limit: limit.toString(),
          search: searchTerm,
          status: statusFilter === 'all' ? '' : statusFilter,
          sort: sortBy
        })

        const response = await fetch(`/api/customer/bookings?${params}`)
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [showAll, limit, searchTerm, statusFilter, sortBy])

  // Handle real-time booking updates
  useRealTimeEvent('booking_status_update', (event) => {
    if (event.type === 'booking_status_update') {
      setBookings(prev => prev.map(booking => 
        booking.id === event.bookingId 
          ? { ...booking, status: event.newStatus }
          : booking
      ))
    }
  })

  // Handle real-time message updates
  useRealTimeEvent('message_received', (event) => {
    if (event.type === 'message_received') {
      setBookings(prev => prev.map(booking => 
        booking.id === event.bookingId 
          ? { 
              ...booking, 
              unread_messages: (booking.unread_messages || 0) + 1 
            }
          : booking
      ))
    }
  })

  const getStatusBadgeVariant = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'secondary',
      'assigned': 'default',
      'confirmed': 'default',
      'in_progress': 'outline',
      'completed': 'default',
      'cancelled': 'destructive'
    }
    return variantMap[status] || 'secondary'
  }

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Finding Washer',
      'assigned': 'Washer Assigned',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'pickup_complete': 'Items Collected',
      'washing': 'Being Washed',
      'ready_for_delivery': 'Ready for Delivery',
      'out_for_delivery': 'Out for Delivery',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service_description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {showAll ? 'All Bookings' : 'Recent Bookings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {showAll ? 'All Bookings' : 'Recent Bookings'}
          </CardTitle>
          {!showAll && bookings.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/user/dashboard/my-bookings">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters (only show for full view) */}
        {showAll && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Finding Washer</SelectItem>
                <SelectItem value="assigned">Washer Assigned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="price_desc">Highest Price</SelectItem>
                <SelectItem value="price_asc">Lowest Price</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No matching bookings' : 'No bookings yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Ready to book your first laundry service?'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/user/dashboard/new-booking">
                  Book Now
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {booking.service_type}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {formatStatus(booking.status)}
                        </Badge>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        £{booking.total_price.toFixed(2)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.requested_date).toLocaleDateString()}</span>
                      </div>
                      {booking.requested_time_start && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{booking.requested_time_start}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-48">
                          {booking.pickup_address?.address || 'Address not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Washer Info */}
                    {booking.washer && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">Washer:</span>
                        <span className="font-medium">{booking.washer.name}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-600">★</span>
                          <span className="text-gray-600 ml-1">
                            {booking.washer.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Service Description */}
                    {booking.service_description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {booking.service_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Created {new Date(booking.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    {booking.unread_messages && booking.unread_messages > 0 && (
                      <Button size="sm" variant="outline" className="relative">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Messages
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                          {booking.unread_messages}
                        </Badge>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/user/dashboard/my-bookings/${booking.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    {['confirmed', 'in_progress', 'pickup_complete', 'washing', 'ready_for_delivery', 'out_for_delivery'].includes(booking.status) && (
                      <Button size="sm" asChild>
                        <Link href={`/user/dashboard/my-bookings/${booking.id}/track`}>
                          Track
                        </Link>
                      </Button>
                    )}
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
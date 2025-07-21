'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Package,
  Star,
  CreditCard,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  User,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRealTimeEvent } from '@/lib/hooks/use-realtime'

interface ActivityItem {
  id: string
  type: 'booking_created' | 'booking_status_change' | 'payment_processed' | 'review_submitted' | 'message_received' | 'washer_assigned'
  title: string
  description: string
  timestamp: string
  metadata?: any
  read: boolean
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/customer/activities?limit=10')
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Handle real-time activity updates
  useRealTimeEvent('booking_status_update', (event) => {
    if (event.type === 'booking_status_update') {
      const newActivity: ActivityItem = {
        id: `status_${event.bookingId}_${Date.now()}`,
        type: 'booking_status_change',
        title: 'Booking Status Updated',
        description: `Your booking status changed to ${event.newStatus}`,
        timestamp: event.timestamp,
        metadata: { bookingId: event.bookingId, status: event.newStatus },
        read: false
      }
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)])
    }
  })

  useRealTimeEvent('message_received', (event) => {
    if (event.type === 'message_received') {
      const newActivity: ActivityItem = {
        id: `message_${event.messageId}`,
        type: 'message_received',
        title: 'New Message',
        description: event.content.length > 50 
          ? `${event.content.substring(0, 50)}...` 
          : event.content,
        timestamp: event.timestamp,
        metadata: { bookingId: event.bookingId, senderId: event.senderId },
        read: false
      }
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)])
    }
  })

  useRealTimeEvent('new_job_assignment', (event) => {
    if (event.type === 'new_job_assignment') {
      const newActivity: ActivityItem = {
        id: `assignment_${event.assignmentId}`,
        type: 'washer_assigned',
        title: 'Washer Assigned',
        description: `A washer has been assigned to your booking`,
        timestamp: event.booking.createdAt,
        metadata: { bookingId: event.booking.id, washerId: event.washerId },
        read: false
      }
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)])
    }
  })

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'booking_created': <Package className="h-4 w-4" />,
      'booking_status_change': <Activity className="h-4 w-4" />,
      'payment_processed': <CreditCard className="h-4 w-4" />,
      'review_submitted': <Star className="h-4 w-4" />,
      'message_received': <MessageCircle className="h-4 w-4" />,
      'washer_assigned': <User className="h-4 w-4" />
    }
    return iconMap[type] || <Activity className="h-4 w-4" />
  }

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'booking_created': 'bg-blue-100 text-blue-600',
      'booking_status_change': 'bg-green-100 text-green-600',
      'payment_processed': 'bg-purple-100 text-purple-600',
      'review_submitted': 'bg-yellow-100 text-yellow-600',
      'message_received': 'bg-indigo-100 text-indigo-600',
      'washer_assigned': 'bg-orange-100 text-orange-600'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-600'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  }

  const markAsRead = async (activityId: string) => {
    try {
      await fetch(`/api/customer/activities/${activityId}/read`, {
        method: 'POST'
      })
      
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, read: true }
          : activity
      ))
    } catch (error) {
      console.error('Error marking activity as read:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
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
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          {activities.some(a => !a.read) && (
            <Badge variant="secondary" className="text-xs">
              {activities.filter(a => !a.read).length} new
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                  !activity.read ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => !activity.read && markAsRead(activity.id)}
              >
                <div className={`p-1.5 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${!activity.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {activity.title}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  
                  {/* Action buttons for specific activity types */}
                  {activity.type === 'message_received' && activity.metadata?.bookingId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-6 px-2 text-xs"
                      asChild
                    >
                      <Link href={`/user/dashboard/my-bookings/${activity.metadata.bookingId}/messages`}>
                        Reply
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                  
                  {activity.type === 'booking_status_change' && activity.metadata?.bookingId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-6 px-2 text-xs"
                      asChild
                    >
                      <Link href={`/user/dashboard/my-bookings/${activity.metadata.bookingId}`}>
                        View Booking
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
                
                {!activity.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                )}
              </div>
            ))}
            
            {activities.length >= 10 && (
              <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
                <Link href="/user/dashboard/activity">
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
// Real-time notifications component

'use client'

import { useEffect, useState } from 'react'
import { useRealTime, useRealTimeEvent } from '@/lib/hooks/use-realtime'
import { PlatformEvent } from '@/lib/realtime/types'
import { toast } from '@/lib/hooks/use-toast'
import { Bell, MessageCircle, Briefcase, CreditCard, MapPin } from 'lucide-react'

interface NotificationToast {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function RealTimeNotifications() {
  const { isConnected, error, connectionStats } = useRealTime()
  const [notifications, setNotifications] = useState<NotificationToast[]>([])

  // Handle different types of real-time events
  useRealTimeEvent('system_notification', (event) => {
    if (event.type === 'system_notification') {
      showNotificationToast({
        id: `system_${Date.now()}`,
        title: event.title,
        description: event.body,
        type: event.priority === 'urgent' ? 'error' : 'info',
        icon: <Bell className="h-4 w-4" />
      })
    }
  })

  useRealTimeEvent('message_received', (event) => {
    if (event.type === 'message_received') {
      showNotificationToast({
        id: `message_${event.messageId}`,
        title: 'New Message',
        description: event.content.length > 50 
          ? `${event.content.substring(0, 50)}...` 
          : event.content,
        type: 'info',
        icon: <MessageCircle className="h-4 w-4" />,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to message thread
            window.location.href = `/messages/${event.bookingId}`
          }
        }
      })
    }
  })

  useRealTimeEvent('new_job_assignment', (event) => {
    if (event.type === 'new_job_assignment') {
      showNotificationToast({
        id: `job_${event.assignmentId}`,
        title: 'New Job Available',
        description: `${event.booking.serviceType} job in your area (Match: ${event.matchScore}%)`,
        type: 'success',
        icon: <Briefcase className="h-4 w-4" />,
        action: {
          label: 'View Job',
          onClick: () => {
            window.location.href = `/washer/dashboard/available-bookings?highlight=${event.booking.id}`
          }
        }
      })
    }
  })

  useRealTimeEvent('booking_status_update', (event) => {
    if (event.type === 'booking_status_update') {
      const statusMessages: Record<string, string> = {
        assigned: 'A washer has been assigned to your booking',
        confirmed: 'Your booking has been confirmed',
        in_progress: 'Your service has started',
        completed: 'Your service has been completed',
        cancelled: 'Your booking has been cancelled'
      }

      const message = statusMessages[event.newStatus] || `Booking status updated to ${event.newStatus}`

      showNotificationToast({
        id: `status_${event.bookingId}_${Date.now()}`,
        title: 'Booking Update',
        description: message,
        type: event.newStatus === 'completed' ? 'success' : 'info',
        icon: <Briefcase className="h-4 w-4" />,
        action: {
          label: 'View Booking',
          onClick: () => {
            window.location.href = `/user/dashboard/my-bookings/${event.bookingId}`
          }
        }
      })
    }
  })

  useRealTimeEvent('payment_processed', (event) => {
    if (event.type === 'payment_processed') {
      showNotificationToast({
        id: `payment_${event.bookingId}`,
        title: event.status === 'success' ? 'Payment Processed' : 'Payment Failed',
        description: event.status === 'success' 
          ? `£${event.amount} payment processed successfully`
          : 'Payment processing failed. Please try again.',
        type: event.status === 'success' ? 'success' : 'error',
        icon: <CreditCard className="h-4 w-4" />
      })
    }
  })

  useRealTimeEvent('location_update', (event) => {
    if (event.type === 'location_update') {
      showNotificationToast({
        id: `location_${event.bookingId}_${Date.now()}`,
        title: 'Location Update',
        description: 'Your washer\'s location has been updated',
        type: 'info',
        icon: <MapPin className="h-4 w-4" />,
        action: {
          label: 'Track',
          onClick: () => {
            window.location.href = `/user/dashboard/my-bookings/${event.bookingId}?tab=tracking`
          }
        }
      })
    }
  })

  const showNotificationToast = (notification: NotificationToast) => {
    setNotifications(prev => [...prev, notification])

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.type === 'error' ? 'destructive' : 'default',
      action: notification.action ? (
        <button onClick={notification.action.onClick}>
          {notification.action.label}
        </button>
      ) : undefined
    })

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 10000)
  }

  // Show connection status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Real-time connection status:', {
        isConnected,
        error,
        connectionStats
      })
    }
  }, [isConnected, error, connectionStats])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  // Show browser notifications for important events
  const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/icons/notification-icon.png',
        badge: '/icons/badge.png'
      })
    }
  }

  // This component doesn't render anything visible
  // It just handles real-time events and shows notifications
  return null
}

// Connection status indicator component
export function RealTimeConnectionStatus() {
  const { isConnected, isConnecting, error, connectionStats } = useRealTime()

  if (!isConnected && !isConnecting && !error) {
    return null // Don't show anything if not attempting to connect
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        px-3 py-2 rounded-lg text-sm font-medium shadow-lg
        ${isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : isConnecting 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }
      `}>
        <div className="flex items-center space-x-2">
          <div className={`
            w-2 h-2 rounded-full
            ${isConnected 
              ? 'bg-green-500' 
              : isConnecting 
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }
          `} />
          <span>
            {isConnected 
              ? 'Connected' 
              : isConnecting 
                ? 'Connecting...'
                : error || 'Disconnected'
            }
          </span>
        </div>
        {isConnected && connectionStats.totalEvents > 0 && (
          <div className="text-xs text-gray-600 mt-1">
            {connectionStats.totalEvents} events received
          </div>
        )}
      </div>
    </div>
  )
}
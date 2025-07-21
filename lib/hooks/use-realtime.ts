// React hook for real-time communication

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PlatformEvent, UserRole } from '@/lib/realtime/types'

interface UseRealTimeOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface RealTimeState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastEvent: PlatformEvent | null
  connectionStats: {
    connectedAt: Date | null
    reconnectAttempts: number
    totalEvents: number
  }
}

export function useRealTime(options: UseRealTimeOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options

  const [state, setState] = useState<RealTimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
    connectionStats: {
      connectedAt: null,
      reconnectAttempts: 0,
      totalEvents: 0
    }
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlersRef = useRef<Map<string, Set<(event: PlatformEvent) => void>>>(new Map())
  const supabaseRef = useRef(createClient())

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (state.isConnecting || state.isConnected) return

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Get current user and session
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication session')
      }

      // Get WebSocket connection info
      const response = await fetch(`/api/realtime/websocket?token=${session.access_token}`)
      const connectionInfo = await response.json()

      if (!response.ok) {
        throw new Error(connectionInfo.error || 'Failed to get connection info')
      }

      // For now, we'll use Supabase real-time instead of WebSocket
      // In production, you would connect to a dedicated WebSocket server
      await connectToSupabaseRealtime(session.user.id, connectionInfo.roles)

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionStats: {
          ...prev.connectionStats,
          connectedAt: new Date(),
          reconnectAttempts: 0
        }
      }))
    } catch (error) {
      console.error('Real-time connection error:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }))

      // Attempt reconnection
      if (state.connectionStats.reconnectAttempts < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            connectionStats: {
              ...prev.connectionStats,
              reconnectAttempts: prev.connectionStats.reconnectAttempts + 1
            }
          }))
          connect()
        }, reconnectInterval)
      }
    }
  }, [state.isConnecting, state.isConnected, maxReconnectAttempts, reconnectInterval])

  // Connect to Supabase real-time as fallback
  const connectToSupabaseRealtime = useCallback(async (userId: string, roles: UserRole[]) => {
    const supabase = supabaseRef.current

    // Subscribe to user-specific notifications
    const userChannel = supabase
      .channel(`user_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        const event: PlatformEvent = {
          type: 'system_notification',
          userId,
          title: payload.new.title,
          body: payload.new.body,
          data: payload.new.data || {},
          priority: 'normal',
          timestamp: payload.new.created_at
        }
        handleEvent(event)
      })
      .subscribe()

    // Subscribe to messages
    const messageChannel = supabase
      .channel(`messages_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload: any) => {
        const event: PlatformEvent = {
          type: 'message_received',
          messageId: payload.new.id,
          bookingId: payload.new.booking_id.toString(),
          senderId: payload.new.sender_id || 'system',
          recipientId: payload.new.recipient_id,
          content: payload.new.content,
          messageType: payload.new.message_type,
          timestamp: payload.new.created_at
        }
        handleEvent(event)
      })
      .subscribe()

    // Subscribe to booking updates if user is a customer
    if (roles.includes('customer')) {
      const bookingChannel = supabase
        .channel(`bookings_customer_${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        }, (payload: any) => {
          // Check if this booking belongs to the user
          if (payload.new.customer_id === userId || payload.new.user_id === userId) {
            const event: PlatformEvent = {
              type: 'booking_status_update',
              bookingId: payload.new.id.toString(),
              newStatus: payload.new.status,
              previousStatus: payload.old?.status,
              timestamp: payload.new.updated_at,
              metadata: {},
              userId
            }
            handleEvent(event)
          }
        })
        .subscribe()
    }

    // Subscribe to washer assignments if user is a washer
    if (roles.includes('washer')) {
      const assignmentChannel = supabase
        .channel(`assignments_washer_${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'washer_assignments'
        }, async (payload: any) => {
          // Get washer profile to check if this assignment is for current user
          const { data: washerProfile } = await supabase
            .from('washer_profiles')
            .select('user_id')
            .eq('id', payload.new.washer_id)
            .single()

          if (washerProfile?.user_id === userId) {
            // Get booking details
            const { data: booking } = await supabase
              .from('bookings')
              .select('*')
              .eq('id', payload.new.booking_id)
              .single()

            if (booking) {
              const event: PlatformEvent = {
                type: 'new_job_assignment',
                washerId: userId,
                booking: {
                  id: booking.id.toString(),
                  customerId: booking.customer_id,
                  serviceType: booking.service_type,
                  serviceDescription: booking.service_description,
                  requestedDate: booking.requested_date,
                  requestedTimeStart: booking.requested_time_start,
                  requestedTimeEnd: booking.requested_time_end,
                  pickupAddress: booking.pickup_address,
                  deliveryAddress: booking.delivery_address,
                  totalPrice: booking.total_price,
                  status: booking.status,
                  createdAt: booking.created_at
                },
                expiresAt: payload.new.expires_at,
                matchScore: payload.new.match_score,
                assignmentId: payload.new.id
              }
              handleEvent(event)
            }
          }
        })
        .subscribe()
    }
  }, [])

  // Handle incoming events
  const handleEvent = useCallback((event: PlatformEvent) => {
    setState(prev => ({
      ...prev,
      lastEvent: event,
      connectionStats: {
        ...prev.connectionStats,
        totalEvents: prev.connectionStats.totalEvents + 1
      }
    }))

    // Trigger event handlers
    const handlers = eventHandlersRef.current.get(event.type) || new Set()
    handlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('Event handler error:', error)
      }
    })

    // Trigger global handlers
    const globalHandlers = eventHandlersRef.current.get('*') || new Set()
    globalHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('Global event handler error:', error)
      }
    })
  }, [])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }))
  }, [])

  // Subscribe to specific event types
  const subscribe = useCallback((
    eventType: string,
    handler: (event: PlatformEvent) => void
  ) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set())
    }
    eventHandlersRef.current.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(eventType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(eventType)
        }
      }
    }
  }, [])

  // Subscribe to all events
  const subscribeToAll = useCallback((handler: (event: PlatformEvent) => void) => {
    return subscribe('*', handler)
  }, [subscribe])

  // Send event (for testing or manual triggers)
  const sendEvent = useCallback((event: PlatformEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event))
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    subscribe,
    subscribeToAll,
    sendEvent
  }
}

// Hook for specific event types
export function useRealTimeEvent<T extends PlatformEvent>(
  eventType: T['type'],
  handler: (event: T) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useRealTime()

  useEffect(() => {
    const unsubscribe = subscribe(eventType, handler as (event: PlatformEvent) => void)
    return unsubscribe
  }, [subscribe, eventType, ...deps])
}

// Hook for booking status updates
export function useBookingStatusUpdates(
  bookingId: string,
  onStatusUpdate: (event: PlatformEvent & { type: 'booking_status_update' }) => void
) {
  useRealTimeEvent('booking_status_update', (event) => {
    if (event.type === 'booking_status_update' && event.bookingId === bookingId) {
      onStatusUpdate(event)
    }
  }, [bookingId])
}

// Hook for new job assignments (washers)
export function useJobAssignments(
  onNewJob: (event: PlatformEvent & { type: 'new_job_assignment' }) => void
) {
  useRealTimeEvent('new_job_assignment', (event) => {
    if (event.type === 'new_job_assignment') {
      onNewJob(event)
    }
  })
}

// Hook for new messages
export function useMessageUpdates(
  onNewMessage: (event: PlatformEvent & { type: 'message_received' }) => void
) {
  useRealTimeEvent('message_received', (event) => {
    if (event.type === 'message_received') {
      onNewMessage(event)
    }
  })
}
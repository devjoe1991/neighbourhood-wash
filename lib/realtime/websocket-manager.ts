// WebSocket connection manager for real-time communication

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { 
  PlatformEvent, 
  UserSession, 
  WebSocketConnection, 
  UserRole,
  BroadcastOptions,
  SubscriptionType 
} from './types'

export class WebSocketManager {
  private connections = new Map<string, WebSocketConnection>()
  private userSessions = new Map<string, UserSession>()
  private roleSubscriptions = new Map<UserRole, Set<string>>()
  private eventQueue = new Map<string, PlatformEvent[]>()
  
  constructor() {
    // Initialize role subscription maps
    this.roleSubscriptions.set('customer', new Set())
    this.roleSubscriptions.set('washer', new Set())
    this.roleSubscriptions.set('admin', new Set())
    
    // Start cleanup interval for dead connections
    setInterval(() => this.cleanupDeadConnections(), 30000) // 30 seconds
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(userId: string, ws: WebSocket, roles: UserRole[]): Promise<void> {
    const socketId = this.generateSocketId()
    
    const session: UserSession = {
      userId,
      roles,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      socketId
    }

    const connection: WebSocketConnection = {
      id: socketId,
      userId,
      socket: ws,
      session,
      isAlive: true,
      lastPing: new Date()
    }

    // Store connection and session
    this.connections.set(socketId, connection)
    this.userSessions.set(userId, session)

    // Subscribe user to role-based events
    roles.forEach(role => {
      this.roleSubscriptions.get(role)?.add(userId)
    })

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(connection)

    // Subscribe to user-specific events
    await this.subscribeToUserEvents(userId, roles)

    // Send queued events if any
    await this.sendQueuedEvents(userId)

    console.log(`WebSocket connection established for user ${userId} with roles: ${roles.join(', ')}`)
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnection(socketId: string): Promise<void> {
    const connection = this.connections.get(socketId)
    if (!connection) return

    const { userId, session } = connection

    // Remove from role subscriptions
    session.roles.forEach(role => {
      this.roleSubscriptions.get(role)?.delete(userId)
    })

    // Clean up
    this.connections.delete(socketId)
    this.userSessions.delete(userId)

    // Update washer online status if applicable
    if (session.roles.includes('washer')) {
      await this.updateWasherOnlineStatus(userId, false)
    }

    console.log(`WebSocket connection closed for user ${userId}`)
  }

  /**
   * Broadcast event to specific user
   */
  async broadcastToUser(userId: string, event: PlatformEvent): Promise<boolean> {
    const session = this.userSessions.get(userId)
    if (!session) {
      // Queue event for when user comes online
      this.queueEvent(userId, event)
      return false
    }

    const connection = this.connections.get(session.socketId)
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      this.queueEvent(userId, event)
      return false
    }

    try {
      connection.socket.send(JSON.stringify(event))
      connection.session.lastActivity = new Date()
      return true
    } catch (error) {
      console.error(`Failed to send event to user ${userId}:`, error)
      this.queueEvent(userId, event)
      return false
    }
  }

  /**
   * Broadcast event to users with specific role
   */
  async broadcastToRole(role: UserRole, event: PlatformEvent, options?: BroadcastOptions): Promise<number> {
    const userIds = this.roleSubscriptions.get(role) || new Set()
    let successCount = 0

    for (const userId of userIds) {
      // Apply filters if provided
      if (options?.excludeUsers?.includes(userId)) continue
      if (options?.includeUsers && !options.includeUsers.includes(userId)) continue

      const success = await this.broadcastToUser(userId, event)
      if (success) successCount++
    }

    return successCount
  }

  /**
   * Broadcast event to multiple users
   */
  async broadcastToUsers(userIds: string[], event: PlatformEvent): Promise<number> {
    let successCount = 0

    for (const userId of userIds) {
      const success = await this.broadcastToUser(userId, event)
      if (success) successCount++
    }

    return successCount
  }

  /**
   * Get online users by role
   */
  getOnlineUsersByRole(role: UserRole): string[] {
    const userIds = this.roleSubscriptions.get(role) || new Set()
    return Array.from(userIds).filter(userId => {
      const session = this.userSessions.get(userId)
      return session && this.isConnectionAlive(session.socketId)
    })
  }

  /**
   * Get user's online status
   */
  isUserOnline(userId: string): boolean {
    const session = this.userSessions.get(userId)
    return session ? this.isConnectionAlive(session.socketId) : false
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const totalConnections = this.connections.size
    const roleStats = {
      customer: this.roleSubscriptions.get('customer')?.size || 0,
      washer: this.roleSubscriptions.get('washer')?.size || 0,
      admin: this.roleSubscriptions.get('admin')?.size || 0
    }

    return {
      totalConnections,
      roleStats,
      queuedEvents: Array.from(this.eventQueue.values()).reduce((sum, events) => sum + events.length, 0)
    }
  }

  /**
   * Private helper methods
   */
  private setupWebSocketHandlers(connection: WebSocketConnection): void {
    const { socket, session } = connection

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleWebSocketMessage(connection, message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    })

    socket.on('pong', () => {
      connection.isAlive = true
      connection.lastPing = new Date()
    })

    socket.on('close', () => {
      this.handleDisconnection(connection.id)
    })

    socket.on('error', (error) => {
      console.error(`WebSocket error for user ${session.userId}:`, error)
    })
  }

  private async handleWebSocketMessage(connection: WebSocketConnection, message: any): Promise<void> {
    const { session } = connection
    session.lastActivity = new Date()

    switch (message.type) {
      case 'ping':
        connection.socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
        break
      
      case 'subscribe':
        await this.handleSubscription(session.userId, message.subscription)
        break
      
      case 'unsubscribe':
        await this.handleUnsubscription(session.userId, message.subscription)
        break
      
      case 'location_update':
        if (session.roles.includes('washer')) {
          await this.handleLocationUpdate(session.userId, message.data)
        }
        break
      
      default:
        console.warn(`Unknown WebSocket message type: ${message.type}`)
    }
  }

  private async subscribeToUserEvents(userId: string, roles: UserRole[]): Promise<void> {
    const supabase = createClient()

    // Subscribe to user-specific notifications
    const { error } = await supabase
      .channel(`user_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleDatabaseEvent('notification', payload.new, userId)
      })
      .subscribe()

    if (error) {
      console.error(`Failed to subscribe to user events for ${userId}:`, error)
    }

    // Subscribe to role-specific events
    if (roles.includes('washer')) {
      await this.subscribeToWasherEvents(userId)
    }

    if (roles.includes('customer')) {
      await this.subscribeToCustomerEvents(userId)
    }
  }

  private async subscribeToWasherEvents(userId: string): Promise<void> {
    const supabase = createClient()

    // Subscribe to washer assignments
    const { error } = await supabase
      .channel(`washer_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'washer_assignments'
      }, (payload) => {
        this.handleWasherAssignment(payload.new)
      })
      .subscribe()

    if (error) {
      console.error(`Failed to subscribe to washer events for ${userId}:`, error)
    }
  }

  private async subscribeToCustomerEvents(userId: string): Promise<void> {
    const supabase = createClient()

    // Subscribe to booking updates for customer's bookings
    const { error } = await supabase
      .channel(`customer_${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        this.handleBookingUpdate(payload.new, payload.old)
      })
      .subscribe()

    if (error) {
      console.error(`Failed to subscribe to customer events for ${userId}:`, error)
    }
  }

  private async handleDatabaseEvent(type: string, data: any, userId: string): Promise<void> {
    switch (type) {
      case 'notification':
        const notificationEvent: PlatformEvent = {
          type: 'system_notification',
          userId: data.user_id,
          title: data.title,
          body: data.body,
          data: data.data || {},
          priority: data.priority || 'normal',
          timestamp: new Date().toISOString()
        }
        await this.broadcastToUser(userId, notificationEvent)
        break
    }
  }

  private async handleWasherAssignment(assignment: any): Promise<void> {
    // Get washer profile to find user_id
    const supabase = createClient()
    const { data: washerProfile } = await supabase
      .from('washer_profiles')
      .select('user_id')
      .eq('id', assignment.washer_id)
      .single()

    if (!washerProfile) return

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', assignment.booking_id)
      .single()

    if (!booking) return

    const assignmentEvent: PlatformEvent = {
      type: 'new_job_assignment',
      washerId: washerProfile.user_id,
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
      expiresAt: assignment.expires_at,
      matchScore: assignment.match_score,
      assignmentId: assignment.id
    }

    await this.broadcastToUser(washerProfile.user_id, assignmentEvent)
  }

  private async handleBookingUpdate(newBooking: any, oldBooking: any): Promise<void> {
    if (newBooking.status !== oldBooking.status) {
      const statusUpdateEvent: PlatformEvent = {
        type: 'booking_status_update',
        bookingId: newBooking.id.toString(),
        newStatus: newBooking.status,
        previousStatus: oldBooking.status,
        timestamp: new Date().toISOString(),
        metadata: {
          updatedFields: Object.keys(newBooking).filter(key => 
            newBooking[key] !== oldBooking[key]
          )
        },
        userId: newBooking.user_id || newBooking.customer_id
      }

      // Broadcast to customer
      if (newBooking.customer_id) {
        await this.broadcastToUser(newBooking.customer_id, statusUpdateEvent)
      }

      // Broadcast to washer
      if (newBooking.washer_id) {
        await this.broadcastToUser(newBooking.washer_id, statusUpdateEvent)
      }
    }
  }

  private async handleSubscription(userId: string, subscription: SubscriptionType): Promise<void> {
    const session = this.userSessions.get(userId)
    if (session) {
      session.subscriptions.add(subscription)
    }
  }

  private async handleUnsubscription(userId: string, subscription: SubscriptionType): Promise<void> {
    const session = this.userSessions.get(userId)
    if (session) {
      session.subscriptions.delete(subscription)
    }
  }

  private async handleLocationUpdate(userId: string, locationData: any): Promise<void> {
    // Update washer location in database and broadcast to relevant customers
    const supabase = createClient()
    
    // Update washer's current location
    await supabase
      .from('washer_profiles')
      .update({ 
        primary_location: locationData.location,
        last_seen_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    // Find active bookings for this washer and broadcast location updates
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('washer_id', userId)
      .in('status', ['confirmed', 'in_progress', 'pickup_complete', 'out_for_delivery'])

    if (activeBookings) {
      for (const booking of activeBookings) {
        const locationEvent: PlatformEvent = {
          type: 'location_update',
          bookingId: booking.id.toString(),
          washerId: userId,
          customerId: booking.customer_id,
          location: locationData.location,
          timestamp: new Date().toISOString()
        }

        await this.broadcastToUser(booking.customer_id, locationEvent)
      }
    }
  }

  private async updateWasherOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const supabase = createClient()
    
    await supabase
      .from('washer_profiles')
      .update({ 
        is_online: isOnline,
        last_seen_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    // Broadcast status change to admins
    const statusEvent: PlatformEvent = {
      type: 'washer_online_status',
      washerId: userId,
      isOnline,
      lastSeen: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }

    await this.broadcastToRole('admin', statusEvent)
  }

  private queueEvent(userId: string, event: PlatformEvent): void {
    if (!this.eventQueue.has(userId)) {
      this.eventQueue.set(userId, [])
    }
    
    const queue = this.eventQueue.get(userId)!
    queue.push(event)
    
    // Limit queue size to prevent memory issues
    if (queue.length > 100) {
      queue.shift() // Remove oldest event
    }
  }

  private async sendQueuedEvents(userId: string): Promise<void> {
    const queue = this.eventQueue.get(userId)
    if (!queue || queue.length === 0) return

    for (const event of queue) {
      await this.broadcastToUser(userId, event)
    }

    // Clear the queue
    this.eventQueue.delete(userId)
  }

  private isConnectionAlive(socketId: string): boolean {
    const connection = this.connections.get(socketId)
    return connection ? connection.isAlive && connection.socket.readyState === WebSocket.OPEN : false
  }

  private cleanupDeadConnections(): void {
    const now = new Date()
    const deadConnections: string[] = []

    for (const [socketId, connection] of this.connections) {
      // Check if connection is dead (no pong response in 60 seconds)
      if (now.getTime() - connection.lastPing.getTime() > 60000) {
        deadConnections.push(socketId)
      } else if (connection.socket.readyState !== WebSocket.OPEN) {
        deadConnections.push(socketId)
      } else {
        // Send ping to check if connection is alive
        try {
          connection.socket.ping()
          connection.isAlive = false // Will be set to true on pong response
        } catch (error) {
          deadConnections.push(socketId)
        }
      }
    }

    // Clean up dead connections
    deadConnections.forEach(socketId => {
      this.handleDisconnection(socketId)
    })

    if (deadConnections.length > 0) {
      console.log(`Cleaned up ${deadConnections.length} dead WebSocket connections`)
    }
  }

  private generateSocketId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager()
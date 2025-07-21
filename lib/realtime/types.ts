// Real-time communication types and interfaces

export type UserRole = 'customer' | 'washer' | 'admin'

// Real-time event types
export type PlatformEvent = 
  | BookingStatusUpdate
  | NewJobAssignment
  | MessageReceived
  | PaymentProcessed
  | LocationUpdate
  | SystemNotification
  | WasherOnlineStatus
  | BookingAssignmentExpired

export interface BookingStatusUpdate {
  type: 'booking_status_update'
  bookingId: string
  newStatus: BookingStatus
  previousStatus?: BookingStatus
  timestamp: string
  metadata: Record<string, any>
  userId: string // Who should receive this update
}

export interface NewJobAssignment {
  type: 'new_job_assignment'
  washerId: string
  booking: BookingDetails
  expiresAt: string
  matchScore: number
  assignmentId: string
}

export interface MessageReceived {
  type: 'message_received'
  messageId: string
  bookingId: string
  senderId: string
  recipientId: string
  content: string
  messageType: 'text' | 'image' | 'system'
  timestamp: string
}

export interface PaymentProcessed {
  type: 'payment_processed'
  bookingId: string
  userId: string
  amount: number
  currency: string
  status: 'success' | 'failed'
  timestamp: string
}

export interface LocationUpdate {
  type: 'location_update'
  bookingId: string
  washerId: string
  customerId: string
  location: {
    lat: number
    lng: number
    address?: string
  }
  timestamp: string
}

export interface SystemNotification {
  type: 'system_notification'
  userId: string
  title: string
  body: string
  data: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  timestamp: string
}

export interface WasherOnlineStatus {
  type: 'washer_online_status'
  washerId: string
  isOnline: boolean
  lastSeen: string
  timestamp: string
}

export interface BookingAssignmentExpired {
  type: 'booking_assignment_expired'
  bookingId: string
  washerId: string
  assignmentId: string
  timestamp: string
}

// Booking status enum
export type BookingStatus = 
  | 'pending'
  | 'assigned'
  | 'confirmed'
  | 'in_progress'
  | 'pickup_complete'
  | 'washing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'refunded'

// User session interface
export interface UserSession {
  userId: string
  roles: UserRole[]
  connectedAt: Date
  lastActivity: Date
  subscriptions: Set<string>
  socketId: string
}

// WebSocket connection interface
export interface WebSocketConnection {
  id: string
  userId: string
  socket: WebSocket
  session: UserSession
  isAlive: boolean
  lastPing: Date
}

// Booking details for real-time events
export interface BookingDetails {
  id: string
  customerId: string
  serviceType: string
  serviceDescription?: string
  requestedDate: string
  requestedTimeStart?: string
  requestedTimeEnd?: string
  pickupAddress: {
    address: string
    coordinates?: { lat: number; lng: number }
  }
  deliveryAddress?: {
    address: string
    coordinates?: { lat: number; lng: number }
  }
  totalPrice: number
  status: BookingStatus
  createdAt: string
}

// Real-time subscription types
export type SubscriptionType = 
  | 'booking_updates'
  | 'job_assignments'
  | 'messages'
  | 'notifications'
  | 'location_updates'
  | 'washer_status'

export interface Subscription {
  type: SubscriptionType
  userId: string
  filters?: Record<string, any>
  createdAt: Date
}

// Event broadcasting options
export interface BroadcastOptions {
  includeRoles?: UserRole[]
  excludeRoles?: UserRole[]
  includeUsers?: string[]
  excludeUsers?: string[]
  requireOnline?: boolean
}
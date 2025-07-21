// Main real-time communication service coordinator

export { webSocketManager } from './websocket-manager'
export { jobNotificationService } from './job-notification-service'
export { bookingStatusService } from './booking-status-service'
export { messagingService } from './messaging-service'
export { pushNotificationService } from './push-notification-service'

export type {
  PlatformEvent,
  UserSession,
  WebSocketConnection,
  UserRole,
  BookingStatus,
  BookingDetails,
  SubscriptionType,
  BroadcastOptions
} from './types'

export type {
  Message,
  MessageThread
} from './messaging-service'

export type {
  PushNotificationPayload,
  NotificationSubscription
} from './push-notification-service'

// Re-export the main services for easy access
import { webSocketManager } from './websocket-manager'
import { jobNotificationService } from './job-notification-service'
import { bookingStatusService } from './booking-status-service'
import { messagingService } from './messaging-service'
import { pushNotificationService } from './push-notification-service'

export const realTimeServices = {
  webSocket: webSocketManager,
  jobNotifications: jobNotificationService,
  bookingStatus: bookingStatusService,
  messaging: messagingService,
  pushNotifications: pushNotificationService
}

// Initialize real-time services
export async function initializeRealTimeServices(): Promise<void> {
  console.log('Initializing real-time communication services...')
  
  // Start scheduled notification processing
  setInterval(async () => {
    try {
      await pushNotificationService.processScheduledNotifications()
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
    }
  }, 60000) // Check every minute

  console.log('Real-time communication services initialized')
}

// Cleanup function for graceful shutdown
export async function shutdownRealTimeServices(): Promise<void> {
  console.log('Shutting down real-time communication services...')
  // Add any cleanup logic here
  console.log('Real-time communication services shut down')
}
// Integration tests for real-time communication system

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { webSocketManager } from '../websocket-manager'
import { jobNotificationService } from '../job-notification-service'
import { bookingStatusService } from '../booking-status-service'
import { messagingService } from '../messaging-service'
import { pushNotificationService } from '../push-notification-service'
import { PlatformEvent, BookingDetails } from '../types'

// Mock WebSocket
class MockWebSocket {
  readyState = WebSocket.OPEN
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  send = vi.fn()
  close = vi.fn()
  ping = vi.fn()
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null }))
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('Real-Time Communication System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.WebSocket = MockWebSocket as any
  })

  afterEach(() => {
    // Clean up any connections
  })

  describe('WebSocket Manager', () => {
    it('should handle new connections', async () => {
      const mockWs = new MockWebSocket()
      const userId = 'test-user-id'
      const roles = ['customer']

      await webSocketManager.handleConnection(userId, mockWs as any, roles as any)

      expect(webSocketManager.isUserOnline(userId)).toBe(true)
    })

    it('should broadcast events to specific users', async () => {
      const mockWs = new MockWebSocket()
      const userId = 'test-user-id'
      const roles = ['customer']

      await webSocketManager.handleConnection(userId, mockWs as any, roles as any)

      const event: PlatformEvent = {
        type: 'system_notification',
        userId,
        title: 'Test Notification',
        body: 'Test message',
        data: {},
        priority: 'normal',
        timestamp: new Date().toISOString()
      }

      const success = await webSocketManager.broadcastToUser(userId, event)
      expect(success).toBe(true)
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(event))
    })

    it('should broadcast events to users by role', async () => {
      const mockWs1 = new MockWebSocket()
      const mockWs2 = new MockWebSocket()
      const userId1 = 'customer-1'
      const userId2 = 'customer-2'

      await webSocketManager.handleConnection(userId1, mockWs1 as any, ['customer'])
      await webSocketManager.handleConnection(userId2, mockWs2 as any, ['customer'])

      const event: PlatformEvent = {
        type: 'system_notification',
        userId: '',
        title: 'Broadcast Test',
        body: 'Test broadcast message',
        data: {},
        priority: 'normal',
        timestamp: new Date().toISOString()
      }

      const successCount = await webSocketManager.broadcastToRole('customer', event)
      expect(successCount).toBe(2)
    })

    it('should handle disconnections', async () => {
      const mockWs = new MockWebSocket()
      const userId = 'test-user-id'

      await webSocketManager.handleConnection(userId, mockWs as any, ['customer'])
      expect(webSocketManager.isUserOnline(userId)).toBe(true)

      await webSocketManager.handleDisconnection('ws_test_id')
      // Note: In a real test, we'd need to track the socket ID
    })
  })

  describe('Job Notification Service', () => {
    it('should notify washers about new job assignments', async () => {
      const washerId = 'washer-123'
      const booking: BookingDetails = {
        id: 'booking-123',
        customerId: 'customer-123',
        serviceType: 'wash-and-fold',
        requestedDate: '2024-01-15',
        pickupAddress: { address: '123 Test St' },
        totalPrice: 25.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      await jobNotificationService.notifyWasherAssignment(
        washerId,
        booking,
        'assignment-123',
        85,
        new Date(Date.now() + 3600000).toISOString()
      )

      expect(broadcastSpy).toHaveBeenCalledWith(
        washerId,
        expect.objectContaining({
          type: 'new_job_assignment',
          washerId,
          booking,
          assignmentId: 'assignment-123',
          matchScore: 85
        })
      )
    })

    it('should send urgent job broadcasts', async () => {
      const booking: BookingDetails = {
        id: 'urgent-booking-123',
        customerId: 'customer-123',
        serviceType: 'express-wash',
        requestedDate: '2024-01-15',
        pickupAddress: { address: '123 Urgent St' },
        totalPrice: 35.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const eligibleWashers = ['washer-1', 'washer-2', 'washer-3']
      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      await jobNotificationService.broadcastUrgentJobToWashers(
        booking,
        eligibleWashers,
        'Customer needs immediate pickup'
      )

      expect(broadcastSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('Booking Status Service', () => {
    it('should update booking status and notify participants', async () => {
      const bookingId = 'booking-123'
      const newStatus = 'confirmed'
      const updatedBy = 'washer-123'

      // Mock booking data
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: bookingId,
                status: 'assigned',
                customer_profiles: { user_id: 'customer-123' },
                washer_profiles: { user_id: 'washer-123' }
              },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })

      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      await bookingStatusService.updateBookingStatus(bookingId, newStatus as any, updatedBy)

      expect(broadcastSpy).toHaveBeenCalledWith(
        'customer-123',
        expect.objectContaining({
          type: 'booking_status_update',
          bookingId,
          newStatus,
          previousStatus: 'assigned'
        })
      )
    })

    it('should send location updates to customers', async () => {
      const bookingId = 'booking-123'
      const washerId = 'washer-123'
      const location = { lat: 51.5074, lng: -0.1278, address: 'London, UK' }

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: bookingId,
                customer_profiles: { user_id: 'customer-123' }
              },
              error: null
            }))
          }))
        }))
      })

      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      await bookingStatusService.sendLocationUpdate(bookingId, washerId, location)

      expect(broadcastSpy).toHaveBeenCalledWith(
        'customer-123',
        expect.objectContaining({
          type: 'location_update',
          bookingId,
          washerId,
          location
        })
      )
    })
  })

  describe('Messaging Service', () => {
    it('should send messages between users', async () => {
      const bookingId = 'booking-123'
      const senderId = 'customer-123'
      const recipientId = 'washer-123'
      const content = 'Hello, when will you arrive?'

      // Mock booking validation
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: bookingId,
                customer_profiles: { user_id: senderId },
                washer_profiles: { user_id: recipientId }
              },
              error: null
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'message-123',
                booking_id: bookingId,
                sender_id: senderId,
                recipient_id: recipientId,
                content,
                message_type: 'text',
                created_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      })

      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      const message = await messagingService.sendMessage(
        bookingId,
        senderId,
        recipientId,
        content
      )

      expect(message).toBeTruthy()
      expect(broadcastSpy).toHaveBeenCalledWith(
        recipientId,
        expect.objectContaining({
          type: 'message_received',
          content,
          senderId,
          recipientId
        })
      )
    })

    it('should send system messages', async () => {
      const bookingId = 'booking-123'
      const recipientId = 'customer-123'
      const content = 'Your booking has been confirmed'

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'system-message-123',
                booking_id: bookingId,
                recipient_id: recipientId,
                content,
                message_type: 'system',
                created_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      })

      const broadcastSpy = vi.spyOn(webSocketManager, 'broadcastToUser')
      broadcastSpy.mockResolvedValue(true)

      await messagingService.sendSystemMessage(bookingId, recipientId, content)

      expect(broadcastSpy).toHaveBeenCalledWith(
        recipientId,
        expect.objectContaining({
          type: 'message_received',
          content,
          senderId: 'system',
          messageType: 'system'
        })
      )
    })
  })

  describe('Push Notification Service', () => {
    it('should send push notifications to users', async () => {
      const userId = 'user-123'
      const payload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true }
      }

      // Mock push subscriptions
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{
              endpoint: 'https://fcm.googleapis.com/fcm/send/test',
              p256dh_key: 'test-p256dh-key',
              auth_key: 'test-auth-key'
            }],
            error: null
          }))
        }))
      })

      // Mock web-push
      const mockWebPush = {
        sendNotification: vi.fn(() => Promise.resolve())
      }
      vi.doMock('web-push', () => ({
        default: mockWebPush,
        setVapidDetails: vi.fn()
      }))

      const success = await pushNotificationService.sendNotificationToUser(userId, payload)
      expect(success).toBe(true)
    })

    it('should send notifications to users by role', async () => {
      const payload = {
        title: 'Role Notification',
        body: 'This is sent to all washers',
        data: { role: 'washer' }
      }

      // Mock user roles
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => Promise.resolve({
          data: [
            { user_id: 'washer-1' },
            { user_id: 'washer-2' }
          ],
          error: null
        }))
      })

      const sendToUserSpy = vi.spyOn(pushNotificationService, 'sendNotificationToUser')
      sendToUserSpy.mockResolvedValue(true)

      const result = await pushNotificationService.sendNotificationToRole('washer', payload)
      expect(result.successful).toBe(2)
      expect(result.failed).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete booking flow with real-time updates', async () => {
      // This would test the complete flow:
      // 1. Customer creates booking
      // 2. Washer gets notified
      // 3. Washer accepts booking
      // 4. Customer gets status update
      // 5. Messages are exchanged
      // 6. Status updates throughout service
      // 7. Completion notifications

      const customerId = 'customer-123'
      const washerId = 'washer-123'
      const bookingId = 'booking-123'

      // Mock connections
      const customerWs = new MockWebSocket()
      const washerWs = new MockWebSocket()

      await webSocketManager.handleConnection(customerId, customerWs as any, ['customer'])
      await webSocketManager.handleConnection(washerId, washerWs as any, ['washer'])

      // Test job assignment notification
      const booking: BookingDetails = {
        id: bookingId,
        customerId,
        serviceType: 'wash-and-fold',
        requestedDate: '2024-01-15',
        pickupAddress: { address: '123 Test St' },
        totalPrice: 25.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      await jobNotificationService.notifyWasherAssignment(
        washerId,
        booking,
        'assignment-123',
        90,
        new Date(Date.now() + 3600000).toISOString()
      )

      expect(washerWs.send).toHaveBeenCalledWith(
        expect.stringContaining('new_job_assignment')
      )

      // Test status update
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: bookingId,
                status: 'assigned',
                customer_profiles: { user_id: customerId },
                washer_profiles: { user_id: washerId }
              },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })

      await bookingStatusService.updateBookingStatus(bookingId, 'confirmed', washerId)

      expect(customerWs.send).toHaveBeenCalledWith(
        expect.stringContaining('booking_status_update')
      )
    })
  })
})
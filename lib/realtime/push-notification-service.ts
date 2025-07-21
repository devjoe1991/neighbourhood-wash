// Push notification service for mobile and web notifications

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { webSocketManager } from './websocket-manager'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

export interface NotificationSubscription {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  createdAt: string
}

export class PushNotificationService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || ''
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string
  ): Promise<void> {
    const supabase = createClient()

    // Store subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })

    if (error) {
      console.error('Failed to store push subscription:', error)
      throw new Error('Failed to subscribe to push notifications')
    }

    console.log(`Push subscription stored for user ${userId}`)
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(userId: string, endpoint?: string): Promise<void> {
    const supabase = createClient()

    let query = supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }

    const { error } = await query

    if (error) {
      console.error('Failed to remove push subscription:', error)
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    const supabase = createClient()

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`)
      return false
    }

    let successCount = 0
    const failedSubscriptions: string[] = []

    // Send to all user's subscriptions (multiple devices)
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        }

        await this.sendPushNotification(pushSubscription, payload)
        successCount++
      } catch (error) {
        console.error(`Failed to send push notification to ${subscription.endpoint}:`, error)
        failedSubscriptions.push(subscription.endpoint)
      }
    }

    // Clean up failed subscriptions
    if (failedSubscriptions.length > 0) {
      await this.cleanupFailedSubscriptions(userId, failedSubscriptions)
    }

    // Create database notification record
    await this.createNotificationRecord(userId, payload, successCount > 0)

    return successCount > 0
  }

  /**
   * Send push notifications to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0
    let failed = 0

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const success = await this.sendNotificationToUser(userId, payload)
          if (success) successful++
          else failed++
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error)
          failed++
        }
      })
    )

    return { successful, failed }
  }

  /**
   * Send notification to users with specific role
   */
  async sendNotificationToRole(
    role: 'customer' | 'washer' | 'admin',
    payload: PushNotificationPayload,
    filters?: {
      online?: boolean
      location?: { lat: number; lng: number; radius: number }
    }
  ): Promise<{ successful: number; failed: number }> {
    const supabase = createClient()

    // Get users with the specified role
    let query = supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles!inner(*)
      `)
      .eq('role', role)
      .eq('status', 'active')

    const { data: userRoles } = await query

    if (!userRoles || userRoles.length === 0) {
      return { successful: 0, failed: 0 }
    }

    let targetUsers = userRoles.map(ur => ur.user_id)

    // Apply filters
    if (filters?.online) {
      targetUsers = targetUsers.filter(userId => 
        webSocketManager.isUserOnline(userId)
      )
    }

    if (filters?.location && role === 'washer') {
      targetUsers = await this.filterWashersByLocation(
        targetUsers,
        filters.location.lat,
        filters.location.lng,
        filters.location.radius
      )
    }

    return await this.sendNotificationToUsers(targetUsers, payload)
  }

  /**
   * Send booking-related notifications
   */
  async sendBookingNotification(
    bookingId: string,
    type: 'assignment' | 'status_update' | 'message' | 'completion',
    recipientRole: 'customer' | 'washer' | 'both',
    customPayload?: Partial<PushNotificationPayload>
  ): Promise<void> {
    const supabase = createClient()

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        customer_profiles!inner(
          user_id,
          profiles!inner(full_name)
        ),
        washer_profiles!inner(
          user_id,
          profiles!inner(full_name)
        )
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const basePayload = this.getBookingNotificationPayload(booking, type)
    const payload = { ...basePayload, ...customPayload }

    // Send to appropriate recipients
    if (recipientRole === 'customer' || recipientRole === 'both') {
      await this.sendNotificationToUser(booking.customer_profiles.user_id, payload)
    }

    if (recipientRole === 'washer' || recipientRole === 'both') {
      if (booking.washer_profiles) {
        await this.sendNotificationToUser(booking.washer_profiles.user_id, payload)
      }
    }
  }

  /**
   * Send emergency or urgent notifications
   */
  async sendUrgentNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title,
      body,
      icon: '/icons/urgent-notification.png',
      badge: '/icons/badge-urgent.png',
      data: { ...data, urgent: true },
      requireInteraction: true,
      tag: 'urgent',
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }

    await this.sendNotificationToUsers(userIds, payload)
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification(
    userId: string,
    payload: PushNotificationPayload,
    scheduledFor: Date
  ): Promise<void> {
    const supabase = createClient()

    // Store scheduled notification
    await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending'
      })
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    const supabase = createClient()

    // Get notifications due for delivery
    const { data: notifications } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    if (!notifications || notifications.length === 0) return

    for (const notification of notifications) {
      try {
        await this.sendNotificationToUser(notification.user_id, {
          title: notification.title,
          body: notification.body,
          data: notification.data
        })

        // Mark as sent
        await supabase
          .from('scheduled_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notification.id)
      } catch (error) {
        console.error(`Failed to send scheduled notification ${notification.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('scheduled_notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)
      }
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: string): Promise<any> {
    const supabase = createClient()

    let query = supabase
      .from('notifications')
      .select('status, type, created_at')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: notifications } = await query

    if (!notifications) return null

    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      delivered: notifications.filter(n => n.status === 'delivered').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      byType: {} as Record<string, number>
    }

    // Count by type
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
    })

    return stats
  }

  /**
   * Private helper methods
   */
  private async sendPushNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<void> {
    // This would integrate with a push notification service like Firebase FCM
    // or use the Web Push Protocol directly
    
    const webpush = require('web-push')
    
    webpush.setVapidDetails(
      'mailto:support@laundryapp.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    )

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/default-notification.png',
      badge: payload.badge || '/icons/badge.png',
      image: payload.image,
      data: payload.data || {},
      actions: payload.actions || [],
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false
    })

    await webpush.sendNotification(subscription, notificationPayload)
  }

  private async cleanupFailedSubscriptions(
    userId: string,
    failedEndpoints: string[]
  ): Promise<void> {
    const supabase = createClient()

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .in('endpoint', failedEndpoints)
  }

  private async createNotificationRecord(
    userId: string,
    payload: PushNotificationPayload,
    success: boolean
  ): Promise<void> {
    const supabase = createClient()

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.data?.type || 'push',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        channels: ['push'],
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null
      })
  }

  private getBookingNotificationPayload(
    booking: any,
    type: string
  ): PushNotificationPayload {
    const payloads: Record<string, PushNotificationPayload> = {
      assignment: {
        title: 'New Job Assignment',
        body: `You have a new ${booking.service_type} job available`,
        icon: '/icons/job-assignment.png',
        data: {
          type: 'job_assignment',
          bookingId: booking.id,
          serviceType: booking.service_type
        },
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        ]
      },
      status_update: {
        title: 'Booking Update',
        body: `Your ${booking.service_type} booking status has been updated`,
        icon: '/icons/status-update.png',
        data: {
          type: 'status_update',
          bookingId: booking.id,
          status: booking.status
        }
      },
      message: {
        title: 'New Message',
        body: 'You have a new message about your booking',
        icon: '/icons/message.png',
        data: {
          type: 'message',
          bookingId: booking.id
        }
      },
      completion: {
        title: 'Service Completed',
        body: `Your ${booking.service_type} service has been completed`,
        icon: '/icons/completion.png',
        data: {
          type: 'completion',
          bookingId: booking.id
        },
        actions: [
          { action: 'rate', title: 'Rate Service' },
          { action: 'view', title: 'View Details' }
        ]
      }
    }

    return payloads[type] || payloads.status_update
  }

  private async filterWashersByLocation(
    washerIds: string[],
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<string[]> {
    const supabase = createClient()

    const { data: washers } = await supabase
      .from('washer_profiles')
      .select('user_id, primary_location')
      .in('user_id', washerIds)
      .not('primary_location', 'is', null)

    if (!washers) return []

    return washers
      .filter(washer => {
        if (!washer.primary_location?.lat || !washer.primary_location?.lng) return false
        
        const distance = this.calculateDistance(
          lat, lng,
          washer.primary_location.lat,
          washer.primary_location.lng
        )
        
        return distance <= radiusKm
      })
      .map(w => w.user_id)
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const pushNotificationService = new PushNotificationService()
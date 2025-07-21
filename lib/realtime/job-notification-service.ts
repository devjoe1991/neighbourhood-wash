// Job notification service for real-time washer notifications

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { webSocketManager } from './websocket-manager'
import { PlatformEvent, BookingDetails } from './types'

export class JobNotificationService {
  /**
   * Notify washers about new job assignments
   */
  async notifyWasherAssignment(
    washerId: string, 
    booking: BookingDetails, 
    assignmentId: string,
    matchScore: number,
    expiresAt: string
  ): Promise<void> {
    const assignmentEvent: PlatformEvent = {
      type: 'new_job_assignment',
      washerId,
      booking,
      expiresAt,
      matchScore,
      assignmentId
    }

    // Send real-time notification
    const success = await webSocketManager.broadcastToUser(washerId, assignmentEvent)

    // Also create a database notification as fallback
    await this.createDatabaseNotification(washerId, {
      type: 'job_assignment',
      title: 'New Job Available',
      body: `New ${booking.serviceType} job available in your area`,
      data: {
        bookingId: booking.id,
        assignmentId,
        matchScore,
        expiresAt,
        serviceType: booking.serviceType,
        location: booking.pickupAddress.address
      },
      priority: 'high'
    })

    console.log(`Job assignment notification sent to washer ${washerId}: ${success ? 'delivered' : 'queued'}`)
  }

  /**
   * Notify washer when assignment expires
   */
  async notifyAssignmentExpired(washerId: string, bookingId: string, assignmentId: string): Promise<void> {
    const expiredEvent: PlatformEvent = {
      type: 'booking_assignment_expired',
      bookingId,
      washerId,
      assignmentId,
      timestamp: new Date().toISOString()
    }

    await webSocketManager.broadcastToUser(washerId, expiredEvent)
  }

  /**
   * Notify washer about booking status changes
   */
  async notifyBookingStatusChange(
    washerId: string,
    bookingId: string,
    newStatus: string,
    previousStatus?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const statusEvent: PlatformEvent = {
      type: 'booking_status_update',
      bookingId,
      newStatus: newStatus as any,
      previousStatus: previousStatus as any,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      userId: washerId
    }

    await webSocketManager.broadcastToUser(washerId, statusEvent)

    // Create database notification for important status changes
    const importantStatuses = ['confirmed', 'cancelled', 'completed']
    if (importantStatuses.includes(newStatus)) {
      await this.createDatabaseNotification(washerId, {
        type: 'booking_update',
        title: this.getStatusChangeTitle(newStatus),
        body: this.getStatusChangeBody(newStatus, bookingId),
        data: {
          bookingId,
          newStatus,
          previousStatus
        },
        priority: newStatus === 'cancelled' ? 'high' : 'normal'
      })
    }
  }

  /**
   * Notify all available washers about urgent job assignments
   */
  async broadcastUrgentJobToWashers(
    booking: BookingDetails,
    eligibleWasherIds: string[],
    urgencyReason: string
  ): Promise<void> {
    const urgentEvent: PlatformEvent = {
      type: 'system_notification',
      userId: '', // Will be set per user
      title: 'Urgent Job Available',
      body: `${urgencyReason} - ${booking.serviceType} job needs immediate attention`,
      data: {
        bookingId: booking.id,
        serviceType: booking.serviceType,
        location: booking.pickupAddress.address,
        urgencyReason,
        isUrgent: true
      },
      priority: 'urgent',
      timestamp: new Date().toISOString()
    }

    // Send to all eligible washers
    for (const washerId of eligibleWasherIds) {
      const washerEvent = { ...urgentEvent, userId: washerId }
      await webSocketManager.broadcastToUser(washerId, washerEvent)
      
      // Also create database notification
      await this.createDatabaseNotification(washerId, {
        type: 'urgent_job',
        title: urgentEvent.title,
        body: urgentEvent.body,
        data: urgentEvent.data,
        priority: 'urgent'
      })
    }

    console.log(`Urgent job broadcast sent to ${eligibleWasherIds.length} washers`)
  }

  /**
   * Notify washer about earnings update
   */
  async notifyEarningsUpdate(
    washerId: string,
    bookingId: string,
    amount: number,
    type: 'payment_received' | 'payout_processed'
  ): Promise<void> {
    const paymentEvent: PlatformEvent = {
      type: 'payment_processed',
      bookingId,
      userId: washerId,
      amount,
      currency: 'GBP',
      status: 'success',
      timestamp: new Date().toISOString()
    }

    await webSocketManager.broadcastToUser(washerId, paymentEvent)

    await this.createDatabaseNotification(washerId, {
      type: 'payment',
      title: type === 'payment_received' ? 'Payment Received' : 'Payout Processed',
      body: `£${amount.toFixed(2)} ${type === 'payment_received' ? 'earned from job' : 'transferred to your account'}`,
      data: {
        bookingId,
        amount,
        type
      },
      priority: 'normal'
    })
  }

  /**
   * Get online washers in a specific area
   */
  async getOnlineWashersInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<string[]> {
    const supabase = createClient()
    
    // Get online washers
    const onlineWashers = webSocketManager.getOnlineUsersByRole('washer')
    
    if (onlineWashers.length === 0) return []

    // Filter by location
    const { data: washersInArea } = await supabase
      .from('washer_profiles')
      .select('user_id, primary_location')
      .in('user_id', onlineWashers)
      .eq('approval_status', 'approved')
      .eq('is_online', true)

    if (!washersInArea) return []

    // Calculate distance and filter
    const nearbyWashers = washersInArea.filter(washer => {
      if (!washer.primary_location?.lat || !washer.primary_location?.lng) return false
      
      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        washer.primary_location.lat,
        washer.primary_location.lng
      )
      
      return distance <= radiusKm
    })

    return nearbyWashers.map(w => w.user_id)
  }

  /**
   * Send bulk notifications to multiple washers
   */
  async sendBulkNotification(
    washerIds: string[],
    title: string,
    body: string,
    data: Record<string, any> = {},
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    const notifications = washerIds.map(washerId => ({
      type: 'system_notification' as const,
      userId: washerId,
      title,
      body,
      data,
      priority,
      timestamp: new Date().toISOString()
    }))

    // Send real-time notifications
    await Promise.all(
      notifications.map(notification => 
        webSocketManager.broadcastToUser(notification.userId, notification)
      )
    )

    // Create database notifications
    await Promise.all(
      washerIds.map(washerId =>
        this.createDatabaseNotification(washerId, {
          type: 'system',
          title,
          body,
          data,
          priority
        })
      )
    )
  }

  /**
   * Private helper methods
   */
  private async createDatabaseNotification(
    userId: string,
    notification: {
      type: string
      title: string
      body: string
      data: Record<string, any>
      priority: string
    }
  ): Promise<void> {
    const supabase = createClient()
    
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channels: ['push'],
        status: 'pending'
      })
  }

  private getStatusChangeTitle(status: string): string {
    const titles: Record<string, string> = {
      confirmed: 'Job Confirmed',
      cancelled: 'Job Cancelled',
      completed: 'Job Completed',
      in_progress: 'Job Started',
      pickup_complete: 'Pickup Complete'
    }
    return titles[status] || 'Job Update'
  }

  private getStatusChangeBody(status: string, bookingId: string): string {
    const bodies: Record<string, string> = {
      confirmed: `Job #${bookingId} has been confirmed. Time to get started!`,
      cancelled: `Job #${bookingId} has been cancelled.`,
      completed: `Job #${bookingId} has been completed successfully.`,
      in_progress: `Job #${bookingId} is now in progress.`,
      pickup_complete: `Pickup for job #${bookingId} is complete.`
    }
    return bodies[status] || `Job #${bookingId} status updated to ${status}`
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

export const jobNotificationService = new JobNotificationService()
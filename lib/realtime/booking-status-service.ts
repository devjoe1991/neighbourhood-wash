// Booking status service for real-time customer updates

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { webSocketManager } from './websocket-manager'
import { PlatformEvent, BookingStatus } from './types'

export class BookingStatusService {
  /**
   * Update booking status and notify all relevant parties
   */
  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    updatedBy: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const supabase = createClient()

    // Get current booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer_profiles!inner(user_id),
        washer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('Failed to fetch booking for status update:', error)
      return
    }

    const previousStatus = booking.status
    const timestamp = new Date().toISOString()

    // Update booking status in database
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        updated_at: timestamp,
        ...(this.getStatusSpecificUpdates(newStatus, timestamp))
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
      return
    }

    // Create status history record
    await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        from_status: previousStatus,
        to_status: newStatus,
        changed_by: updatedBy,
        notes: metadata.notes || null
      })

    // Create status update event
    const statusEvent: PlatformEvent = {
      type: 'booking_status_update',
      bookingId: bookingId.toString(),
      newStatus,
      previousStatus: previousStatus as BookingStatus,
      timestamp,
      metadata: {
        ...metadata,
        updatedBy,
        estimatedTime: this.getEstimatedTimeForStatus(newStatus),
        nextSteps: this.getNextStepsForStatus(newStatus)
      },
      userId: booking.customer_profiles.user_id
    }

    // Notify customer
    await webSocketManager.broadcastToUser(booking.customer_profiles.user_id, statusEvent)

    // Notify washer if different from updater
    if (booking.washer_profiles && booking.washer_profiles.user_id !== updatedBy) {
      const washerEvent = { ...statusEvent, userId: booking.washer_profiles.user_id }
      await webSocketManager.broadcastToUser(booking.washer_profiles.user_id, washerEvent)
    }

    // Create database notifications
    await this.createStatusNotifications(booking, newStatus, previousStatus)

    // Handle status-specific actions
    await this.handleStatusSpecificActions(booking, newStatus, previousStatus)

    console.log(`Booking ${bookingId} status updated from ${previousStatus} to ${newStatus}`)
  }

  /**
   * Send live location update to customer
   */
  async sendLocationUpdate(
    bookingId: string,
    washerId: string,
    location: { lat: number; lng: number; address?: string },
    estimatedArrival?: string
  ): Promise<void> {
    const supabase = createClient()

    // Get booking and customer info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const locationEvent: PlatformEvent = {
      type: 'location_update',
      bookingId: bookingId.toString(),
      washerId,
      customerId: booking.customer_profiles.user_id,
      location,
      timestamp: new Date().toISOString()
    }

    // Add estimated arrival if provided
    if (estimatedArrival) {
      locationEvent.metadata = { estimatedArrival }
    }

    await webSocketManager.broadcastToUser(booking.customer_profiles.user_id, locationEvent)
  }

  /**
   * Send progress update with detailed information
   */
  async sendProgressUpdate(
    bookingId: string,
    progressType: 'pickup' | 'washing' | 'delivery',
    details: {
      message: string
      percentage?: number
      estimatedCompletion?: string
      images?: string[]
    }
  ): Promise<void> {
    const supabase = createClient()

    // Get booking participants
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_profiles!inner(user_id),
        washer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const progressEvent: PlatformEvent = {
      type: 'system_notification',
      userId: booking.customer_profiles.user_id,
      title: this.getProgressTitle(progressType),
      body: details.message,
      data: {
        bookingId,
        progressType,
        percentage: details.percentage,
        estimatedCompletion: details.estimatedCompletion,
        images: details.images || []
      },
      priority: 'normal',
      timestamp: new Date().toISOString()
    }

    // Send to customer
    await webSocketManager.broadcastToUser(booking.customer_profiles.user_id, progressEvent)

    // Create database notification
    await this.createDatabaseNotification(booking.customer_profiles.user_id, {
      type: 'progress_update',
      title: progressEvent.title,
      body: progressEvent.body,
      data: progressEvent.data,
      priority: 'normal'
    })
  }

  /**
   * Send estimated time updates
   */
  async sendTimeEstimateUpdate(
    bookingId: string,
    estimationType: 'pickup' | 'completion' | 'delivery',
    estimatedTime: string,
    reason?: string
  ): Promise<void> {
    const supabase = createClient()

    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const timeEvent: PlatformEvent = {
      type: 'system_notification',
      userId: booking.customer_profiles.user_id,
      title: 'Time Update',
      body: `${this.getEstimationTypeLabel(estimationType)} updated to ${estimatedTime}${reason ? ` - ${reason}` : ''}`,
      data: {
        bookingId,
        estimationType,
        estimatedTime,
        reason,
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      timestamp: new Date().toISOString()
    }

    await webSocketManager.broadcastToUser(booking.customer_profiles.user_id, timeEvent)
  }

  /**
   * Send completion notification with summary
   */
  async sendCompletionSummary(
    bookingId: string,
    summary: {
      itemsProcessed: number
      totalTime: string
      specialNotes?: string
      beforeImages?: string[]
      afterImages?: string[]
      rating?: number
    }
  ): Promise<void> {
    const supabase = createClient()

    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        service_type,
        total_price,
        customer_profiles!inner(user_id),
        washer_profiles!inner(user_id, profiles!inner(full_name))
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const completionEvent: PlatformEvent = {
      type: 'system_notification',
      userId: booking.customer_profiles.user_id,
      title: 'Service Completed!',
      body: `Your ${booking.service_type} service has been completed by ${booking.washer_profiles.profiles.full_name}`,
      data: {
        bookingId,
        summary,
        serviceType: booking.service_type,
        totalPrice: booking.total_price,
        washerName: booking.washer_profiles.profiles.full_name,
        completedAt: new Date().toISOString()
      },
      priority: 'high',
      timestamp: new Date().toISOString()
    }

    await webSocketManager.broadcastToUser(booking.customer_profiles.user_id, completionEvent)

    // Create database notification
    await this.createDatabaseNotification(booking.customer_profiles.user_id, {
      type: 'service_completed',
      title: completionEvent.title,
      body: completionEvent.body,
      data: completionEvent.data,
      priority: 'high'
    })
  }

  /**
   * Get booking status history for customer
   */
  async getBookingStatusHistory(bookingId: string): Promise<any[]> {
    const supabase = createClient()

    const { data: history } = await supabase
      .from('booking_status_history')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    return history || []
  }

  /**
   * Get real-time booking updates for customer dashboard
   */
  async getActiveBookingUpdates(customerId: string): Promise<any[]> {
    const supabase = createClient()

    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        service_type,
        requested_date,
        total_price,
        washer_profiles!inner(
          user_id,
          profiles!inner(full_name, avatar_url)
        )
      `)
      .eq('customer_id', customerId)
      .in('status', ['assigned', 'confirmed', 'in_progress', 'pickup_complete', 'washing', 'ready_for_delivery', 'out_for_delivery'])
      .order('created_at', { ascending: false })

    return bookings || []
  }

  /**
   * Private helper methods
   */
  private getStatusSpecificUpdates(status: BookingStatus, timestamp: string): Record<string, any> {
    const updates: Record<string, any> = {}

    switch (status) {
      case 'assigned':
        updates.assigned_at = timestamp
        break
      case 'confirmed':
        updates.confirmed_at = timestamp
        break
      case 'in_progress':
        updates.started_at = timestamp
        break
      case 'completed':
        updates.completed_at = timestamp
        break
      case 'cancelled':
        updates.cancelled_at = timestamp
        break
    }

    return updates
  }

  private getEstimatedTimeForStatus(status: BookingStatus): string | null {
    const estimates: Record<string, string> = {
      assigned: '15-30 minutes for confirmation',
      confirmed: '1-2 hours for pickup',
      in_progress: '2-4 hours for completion',
      pickup_complete: '3-6 hours for washing',
      washing: '2-4 hours remaining',
      ready_for_delivery: '1-2 hours for delivery',
      out_for_delivery: '30-60 minutes for delivery'
    }
    return estimates[status] || null
  }

  private getNextStepsForStatus(status: BookingStatus): string | null {
    const nextSteps: Record<string, string> = {
      assigned: 'Waiting for washer confirmation',
      confirmed: 'Washer will arrive for pickup',
      in_progress: 'Items being collected',
      pickup_complete: 'Items being washed',
      washing: 'Washing in progress',
      ready_for_delivery: 'Preparing for delivery',
      out_for_delivery: 'Items on the way back to you',
      completed: 'Please rate your experience'
    }
    return nextSteps[status] || null
  }

  private async createStatusNotifications(
    booking: any,
    newStatus: BookingStatus,
    previousStatus: BookingStatus
  ): Promise<void> {
    const customerNotification = this.getCustomerNotificationForStatus(newStatus, booking)
    const washerNotification = this.getWasherNotificationForStatus(newStatus, booking)

    // Create customer notification
    if (customerNotification) {
      await this.createDatabaseNotification(booking.customer_profiles.user_id, customerNotification)
    }

    // Create washer notification
    if (washerNotification && booking.washer_profiles) {
      await this.createDatabaseNotification(booking.washer_profiles.user_id, washerNotification)
    }
  }

  private getCustomerNotificationForStatus(status: BookingStatus, booking: any): any | null {
    const notifications: Record<string, any> = {
      assigned: {
        type: 'booking_update',
        title: 'Washer Assigned',
        body: `A washer has been assigned to your ${booking.service_type} booking`,
        priority: 'high'
      },
      confirmed: {
        type: 'booking_update',
        title: 'Booking Confirmed',
        body: `Your washer has confirmed your ${booking.service_type} booking`,
        priority: 'high'
      },
      in_progress: {
        type: 'booking_update',
        title: 'Service Started',
        body: 'Your washer has started working on your laundry',
        priority: 'normal'
      },
      completed: {
        type: 'booking_update',
        title: 'Service Completed',
        body: 'Your laundry service has been completed!',
        priority: 'high'
      }
    }

    const notification = notifications[status]
    if (notification) {
      notification.data = { bookingId: booking.id, status }
    }

    return notification
  }

  private getWasherNotificationForStatus(status: BookingStatus, booking: any): any | null {
    const notifications: Record<string, any> = {
      cancelled: {
        type: 'booking_update',
        title: 'Booking Cancelled',
        body: `Booking #${booking.id} has been cancelled`,
        priority: 'normal'
      }
    }

    const notification = notifications[status]
    if (notification) {
      notification.data = { bookingId: booking.id, status }
    }

    return notification
  }

  private async handleStatusSpecificActions(
    booking: any,
    newStatus: BookingStatus,
    previousStatus: BookingStatus
  ): Promise<void> {
    switch (newStatus) {
      case 'completed':
        // Trigger payment processing
        await this.triggerPaymentProcessing(booking.id)
        break
      
      case 'cancelled':
        // Handle cancellation logic
        await this.handleBookingCancellation(booking.id, booking.status)
        break
    }
  }

  private async triggerPaymentProcessing(bookingId: string): Promise<void> {
    // This would integrate with the payment system
    console.log(`Triggering payment processing for booking ${bookingId}`)
  }

  private async handleBookingCancellation(bookingId: string, currentStatus: string): Promise<void> {
    // This would handle refund logic based on cancellation timing
    console.log(`Handling cancellation for booking ${bookingId} (was ${currentStatus})`)
  }

  private getProgressTitle(progressType: string): string {
    const titles: Record<string, string> = {
      pickup: 'Pickup Update',
      washing: 'Washing Update',
      delivery: 'Delivery Update'
    }
    return titles[progressType] || 'Progress Update'
  }

  private getEstimationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      pickup: 'Pickup time',
      completion: 'Completion time',
      delivery: 'Delivery time'
    }
    return labels[type] || 'Estimated time'
  }

  private async createDatabaseNotification(
    userId: string,
    notification: {
      type: string
      title: string
      body: string
      data?: Record<string, any>
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
        data: notification.data || {},
        channels: ['push'],
        status: 'pending'
      })
  }
}

export const bookingStatusService = new BookingStatusService()
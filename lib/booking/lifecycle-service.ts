/**
 * Booking Lifecycle Management Service
 * Handles the complete booking lifecycle from creation to completion
 */

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { JobAssignmentService } from './assignment-service'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type Booking = Tables['bookings']['Row']

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

export interface BookingUpdate {
  status: BookingStatus
  notes?: string
  metadata?: Record<string, any>
}

export interface BookingCreationData {
  customerId: string
  serviceType: string
  serviceDescription?: string
  requestedDate: string
  requestedTimeStart?: string
  requestedTimeEnd?: string
  pickupAddress: {
    lat: number
    lng: number
    address: string
    city: string
    postalCode: string
  }
  deliveryAddress?: {
    lat: number
    lng: number
    address: string
    city: string
    postalCode: string
  }
  items: Array<{
    itemType: string
    quantity: number
    specialInstructions?: string
  }>
  basePrice: number
  additionalFees?: number
  discountAmount?: number
}

export class BookingLifecycleService {
  private supabase = createSupabaseServerClient()
  private assignmentService = new JobAssignmentService()

  /**
   * Create a new booking and initiate the assignment process
   */
  async createBooking(data: BookingCreationData): Promise<{ success: boolean; bookingId?: number; error?: string }> {
    try {
      // 1. Validate customer exists
      const { data: customerProfile, error: customerError } = await this.supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', data.customerId)
        .single()

      if (customerError || !customerProfile) {
        return { success: false, error: 'Customer profile not found' }
      }

      // 2. Calculate total price
      const totalPrice = data.basePrice + (data.additionalFees || 0) - (data.discountAmount || 0)

      // 3. Create booking record
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .insert({
          customer_id: customerProfile.id,
          service_type: data.serviceType,
          service_description: data.serviceDescription,
          requested_date: data.requestedDate,
          requested_time_start: data.requestedTimeStart,
          requested_time_end: data.requestedTimeEnd,
          pickup_address: data.pickupAddress,
          delivery_address: data.deliveryAddress,
          base_price: data.basePrice,
          additional_fees: data.additionalFees || 0,
          discount_amount: data.discountAmount || 0,
          total_price: totalPrice,
          status: 'pending'
        })
        .select('id')
        .single()

      if (bookingError || !booking) {
        console.error('Error creating booking:', bookingError)
        return { success: false, error: 'Failed to create booking' }
      }

      // 4. Create booking items
      if (data.items.length > 0) {
        const { error: itemsError } = await this.supabase
          .from('booking_items')
          .insert(
            data.items.map(item => ({
              booking_id: booking.id,
              item_type: item.itemType,
              quantity: item.quantity,
              special_instructions: item.specialInstructions
            }))
          )

        if (itemsError) {
          console.error('Error creating booking items:', itemsError)
          // Continue anyway - items are not critical
        }
      }

      // 5. Create initial status history
      await this.createStatusHistory(booking.id, null, 'pending', data.customerId, 'Booking created')

      // 6. Initiate assignment process
      const assignmentResult = await this.assignmentService.assignBooking(booking.id)
      
      if (!assignmentResult.success) {
        console.warn('Initial assignment failed:', assignmentResult.error)
        // Booking is still created, assignment can be retried later
      }

      return { success: true, bookingId: booking.id }
    } catch (error) {
      console.error('Error in createBooking:', error)
      return { success: false, error: 'Failed to create booking' }
    }
  }

  /**
   * Update booking status with proper validation and notifications
   */
  async updateBookingStatus(
    bookingId: number,
    update: BookingUpdate,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get current booking
      const { data: currentBooking, error: fetchError } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (fetchError || !currentBooking) {
        return { success: false, error: 'Booking not found' }
      }

      // 2. Validate status transition
      const isValidTransition = this.isValidStatusTransition(
        currentBooking.status as BookingStatus,
        update.status
      )

      if (!isValidTransition) {
        return { 
          success: false, 
          error: `Invalid status transition from ${currentBooking.status} to ${update.status}` 
        }
      }

      // 3. Update booking
      const updateData: any = {
        status: update.status,
        updated_at: new Date().toISOString()
      }

      // Add timestamp fields based on status
      switch (update.status) {
        case 'in_progress':
          updateData.started_at = new Date().toISOString()
          break
        case 'completed':
          updateData.completed_at = new Date().toISOString()
          break
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()
          updateData.cancellation_reason = update.notes
          break
      }

      const { error: updateError } = await this.supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return { success: false, error: 'Failed to update booking' }
      }

      // 4. Create status history
      await this.createStatusHistory(
        bookingId,
        currentBooking.status,
        update.status,
        updatedBy,
        update.notes
      )

      // 5. Send notifications based on status
      await this.sendStatusNotifications(bookingId, update.status, currentBooking)

      // 6. Handle special status logic
      await this.handleStatusSpecificLogic(bookingId, update.status, currentBooking)

      return { success: true }
    } catch (error) {
      console.error('Error in updateBookingStatus:', error)
      return { success: false, error: 'Failed to update booking status' }
    }
  }

  /**
   * Cancel a booking with proper cleanup
   */
  async cancelBooking(
    bookingId: number,
    reason: string,
    cancelledBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get booking details
      const { data: booking, error: fetchError } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return { success: false, error: 'Booking not found' }
      }

      // 2. Check if booking can be cancelled
      const cancellableStatuses: BookingStatus[] = ['pending', 'assigned', 'confirmed']
      if (!cancellableStatuses.includes(booking.status as BookingStatus)) {
        return { success: false, error: 'Booking cannot be cancelled in current status' }
      }

      // 3. Cancel any pending assignments
      await this.supabase
        .from('washer_assignments')
        .update({
          status: 'cancelled',
          responded_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .eq('status', 'offered')

      // 4. Update booking status
      const result = await this.updateBookingStatus(
        bookingId,
        { status: 'cancelled', notes: reason },
        cancelledBy
      )

      return result
    } catch (error) {
      console.error('Error in cancelBooking:', error)
      return { success: false, error: 'Failed to cancel booking' }
    }
  }

  /**
   * Get booking details with related data
   */
  async getBookingDetails(bookingId: number): Promise<any> {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customer_profiles!inner(
          user_id,
          profiles!inner(full_name, email, phone_number)
        ),
        washer_profiles(
          user_id,
          profiles!inner(full_name, email, phone_number),
          rating,
          total_jobs
        ),
        booking_items(*),
        washer_assignments(
          *,
          washer_profiles!inner(
            user_id,
            profiles!inner(full_name, phone_number),
            rating
          )
        ),
        booking_status_history(*)
      `)
      .eq('id', bookingId)
      .single()

    if (error) {
      console.error('Error fetching booking details:', error)
      return null
    }

    return booking
  }

  /**
   * Get bookings for a customer
   */
  async getCustomerBookings(customerId: string, status?: BookingStatus): Promise<any[]> {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        washer_profiles(
          user_id,
          profiles!inner(full_name),
          rating
        ),
        booking_items(*)
      `)
      .eq('customer_profiles.user_id', customerId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching customer bookings:', error)
      return []
    }

    return bookings || []
  }

  /**
   * Get bookings for a washer
   */
  async getWasherBookings(washerId: string, status?: BookingStatus): Promise<any[]> {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        customer_profiles!inner(
          user_id,
          profiles!inner(full_name)
        ),
        booking_items(*)
      `)
      .eq('washer_id', washerId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching washer bookings:', error)
      return []
    }

    return bookings || []
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['assigned', 'cancelled'],
      assigned: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['pickup_complete', 'cancelled'],
      pickup_complete: ['washing'],
      washing: ['ready_for_delivery'],
      ready_for_delivery: ['out_for_delivery'],
      out_for_delivery: ['completed'],
      completed: ['refunded'], // Only in special cases
      cancelled: ['refunded'],
      refunded: [] // Terminal state
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }

  /**
   * Create status history record
   */
  private async createStatusHistory(
    bookingId: number,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    notes?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: changedBy,
        notes
      })

    if (error) {
      console.error('Error creating status history:', error)
    }
  }

  /**
   * Send notifications based on status changes
   */
  private async sendStatusNotifications(
    bookingId: number,
    newStatus: BookingStatus,
    booking: any
  ): Promise<void> {
    const notifications = this.getStatusNotifications(newStatus, bookingId)
    
    for (const notification of notifications) {
      await this.supabase
        .from('notifications')
        .insert(notification)
    }
  }

  /**
   * Get notification templates for status changes
   */
  private getStatusNotifications(status: BookingStatus, bookingId: number): any[] {
    const notifications: any[] = []

    switch (status) {
      case 'confirmed':
        notifications.push({
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          body: 'Your laundry booking has been confirmed!',
          data: { bookingId: bookingId.toString() }
        })
        break
      case 'in_progress':
        notifications.push({
          type: 'booking_started',
          title: 'Service Started',
          body: 'Your washer has started working on your laundry.',
          data: { bookingId: bookingId.toString() }
        })
        break
      case 'completed':
        notifications.push({
          type: 'booking_completed',
          title: 'Service Completed',
          body: 'Your laundry service has been completed!',
          data: { bookingId: bookingId.toString() }
        })
        break
      case 'cancelled':
        notifications.push({
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          body: 'Your booking has been cancelled.',
          data: { bookingId: bookingId.toString() }
        })
        break
    }

    return notifications
  }

  /**
   * Handle status-specific business logic
   */
  private async handleStatusSpecificLogic(
    bookingId: number,
    newStatus: BookingStatus,
    booking: any
  ): Promise<void> {
    switch (newStatus) {
      case 'completed':
        // Update washer statistics
        if (booking.washer_id) {
          await this.updateWasherStats(booking.washer_id, 'completed')
        }
        break
      case 'cancelled':
        // Update washer statistics if applicable
        if (booking.washer_id && booking.status !== 'pending') {
          await this.updateWasherStats(booking.washer_id, 'cancelled')
        }
        break
    }
  }

  /**
   * Update washer performance statistics
   */
  private async updateWasherStats(washerId: string, outcome: 'completed' | 'cancelled'): Promise<void> {
    const { data: washerProfile, error: fetchError } = await this.supabase
      .from('washer_profiles')
      .select('total_jobs, completed_jobs, cancellation_rate')
      .eq('user_id', washerId)
      .single()

    if (fetchError || !washerProfile) {
      console.error('Error fetching washer profile for stats update:', fetchError)
      return
    }

    const totalJobs = (washerProfile.total_jobs || 0) + 1
    const completedJobs = washerProfile.completed_jobs || 0
    const newCompletedJobs = outcome === 'completed' ? completedJobs + 1 : completedJobs
    const cancellationRate = ((totalJobs - newCompletedJobs) / totalJobs) * 100

    const { error: updateError } = await this.supabase
      .from('washer_profiles')
      .update({
        total_jobs: totalJobs,
        completed_jobs: newCompletedJobs,
        cancellation_rate: cancellationRate
      })
      .eq('user_id', washerId)

    if (updateError) {
      console.error('Error updating washer stats:', updateError)
    }
  }
}
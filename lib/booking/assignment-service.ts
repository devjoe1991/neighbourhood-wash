/**
 * Job Assignment Service
 * Handles real-time job assignment, washer notifications, and booking lifecycle management
 */

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { SmartMatchingEngine, type MatchingCriteria, type BookingRequest, type MatchingScore } from './matching-engine'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
// TODO: Update database types to include new tables
// type WasherAssignment = Tables['washer_assignments']['Row']
// type BookingStatusHistory = Tables['booking_status_history']['Row']
type WasherAssignment = any
type BookingStatusHistory = any

export interface AssignmentResult {
  success: boolean
  assignmentId?: string
  error?: string
  matchScore?: number
}

export interface NotificationPayload {
  userId: string
  type: string
  title: string
  body: string
  data: Record<string, any>
  channels: string[]
}

export class JobAssignmentService {
  private supabase = createSupabaseServerClient()
  private matchingEngine = new SmartMatchingEngine()

  /**
   * Assign a booking to the best available washer
   */
  async assignBooking(bookingId: number): Promise<AssignmentResult> {
    try {
      // 1. Get booking details
      const booking = await this.getBookingDetails(bookingId)
      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      // 2. Check if booking is already assigned
      if (booking.status !== 'pending') {
        return { success: false, error: 'Booking is not in pending status' }
      }

      // 3. Build matching criteria from booking
      const criteria = await this.buildMatchingCriteria(booking)
      
      // 4. Find best matches
      const matches = await this.matchingEngine.findBestMatches(booking, criteria)
      
      if (matches.length === 0) {
        return { success: false, error: 'No available washers found' }
      }

      // 5. Try to assign to the best match
      const bestMatch = matches[0]
      const assignmentResult = await this.createAssignment(booking, bestMatch)
      
      if (assignmentResult.success) {
        // 6. Update booking status
        await this.updateBookingStatus(bookingId, 'assigned', 'system')
        
        // 7. Send notification to washer
        await this.notifyWasher(bestMatch, booking)
        
        // 8. Schedule automatic reassignment if not accepted
        await this.scheduleReassignment(assignmentResult.assignmentId!, bookingId, matches.slice(1))
      }

      return assignmentResult
    } catch (error) {
      console.error('Error in assignBooking:', error)
      return { success: false, error: 'Failed to assign booking' }
    }
  }

  /**
   * Handle washer response to job assignment
   */
  async handleWasherResponse(
    assignmentId: string, 
    washerId: string, 
    response: 'accepted' | 'declined'
  ): Promise<AssignmentResult> {
    try {
      // 1. Get assignment details
      const { data: assignment, error: assignmentError } = await this.supabase
        .from('washer_assignments')
        .select('*, bookings(*)')
        .eq('id', assignmentId)
        .eq('washer_id', washerId)
        .eq('status', 'offered')
        .single()

      if (assignmentError || !assignment) {
        return { success: false, error: 'Assignment not found or already responded' }
      }

      // 2. Update assignment status
      const { error: updateError } = await this.supabase
        .from('washer_assignments')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (updateError) {
        console.error('Error updating assignment:', updateError)
        return { success: false, error: 'Failed to update assignment' }
      }

      if (response === 'accepted') {
        // 3a. If accepted, confirm the booking
        await this.confirmBooking(assignment.booking_id, washerId)
        
        // Cancel other pending assignments for this booking
        await this.cancelOtherAssignments(assignment.booking_id, assignmentId)
        
        return { success: true, assignmentId }
      } else {
        // 3b. If declined, try to reassign to next best match
        return await this.handleDeclinedAssignment(assignment.booking_id)
      }
    } catch (error) {
      console.error('Error in handleWasherResponse:', error)
      return { success: false, error: 'Failed to process washer response' }
    }
  }

  /**
   * Handle automatic reassignment for expired offers
   */
  async handleExpiredAssignments(): Promise<void> {
    try {
      // Find expired assignments
      const { data: expiredAssignments, error } = await this.supabase
        .from('washer_assignments')
        .select('*')
        .eq('status', 'offered')
        .lt('expires_at', new Date().toISOString())

      if (error || !expiredAssignments) {
        console.error('Error fetching expired assignments:', error)
        return
      }

      // Process each expired assignment
      for (const assignment of expiredAssignments) {
        await this.handleExpiredAssignment(assignment.id, assignment.booking_id)
      }
    } catch (error) {
      console.error('Error handling expired assignments:', error)
    }
  }

  /**
   * Get booking details for assignment
   */
  private async getBookingDetails(bookingId: number): Promise<BookingRequest | null> {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('Error fetching booking:', error)
      return null
    }

    return {
      id: booking.id.toString(),
      customer_id: booking.customer_profiles.user_id,
      service_type: booking.service_type || 'standard',
      service_description: booking.service_description,
      requested_date: booking.requested_date || booking.created_at,
      requested_time_start: booking.requested_time_start,
      requested_time_end: booking.requested_time_end,
      pickup_address: booking.pickup_address as any || { lat: 0, lng: 0, address: '' },
      delivery_address: booking.delivery_address as any,
      total_price: Number(booking.total_price || 0),
      status: booking.status,
      created_at: booking.created_at,
      // Legacy compatibility fields
      customerId: booking.customer_profiles.user_id,
      serviceType: booking.service_type || 'standard',
      requestedDate: new Date(booking.requested_date || booking.created_at),
      pickupAddress: booking.pickup_address as any || { lat: 0, lng: 0, address: '' },
      basePrice: Number(booking.total_price || 0),
      specialRequirements: booking.service_description ? [booking.service_description] : undefined
    }
  }

  /**
   * Build matching criteria from booking details
   */
  private async buildMatchingCriteria(booking: BookingRequest): Promise<MatchingCriteria> {
    return {
      location: {
        customerLocation: booking.pickup_address,
        maxDistance: 15 // 15km default radius
      },
      timing: {
        requestedDate: new Date(booking.requested_date),
        flexibility: 2 // 2 hours flexibility
      },
      service: {
        serviceType: [booking.service_type],
        specialRequirements: booking.service_description ? [booking.service_description] : undefined
      },
      preferences: {
        preferredWashers: [], // Could be populated from customer preferences
        blockedWashers: [],   // Could be populated from customer blocks
        ratingThreshold: 3.0  // Minimum 3-star rating
      }
    }
  }

  /**
   * Create washer assignment record
   */
  private async createAssignment(
    booking: BookingRequest, 
    match: MatchingScore
  ): Promise<AssignmentResult> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minute expiry

    const { data: assignment, error } = await this.supabase
      .from('washer_assignments')
      .insert({
        booking_id: booking.id,
        washer_id: match.washerId,
        assignment_type: 'auto',
        match_score: match.totalScore,
        distance_km: match.distanceKm,
        estimated_travel_time_minutes: match.estimatedTravelTime,
        status: 'offered',
        expires_at: expiresAt.toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return { success: false, error: 'Failed to create assignment' }
    }

    return { 
      success: true, 
      assignmentId: assignment.id,
      matchScore: match.totalScore
    }
  }

  /**
   * Update booking status and create history record
   */
  private async updateBookingStatus(
    bookingId: number, 
    newStatus: string, 
    changedBy: string
  ): Promise<void> {
    // Get current status
    const { data: currentBooking } = await this.supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    const fromStatus = currentBooking?.status

    // Update booking status
    const { error: updateError } = await this.supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'assigned' && { assigned_at: new Date().toISOString() }),
        ...(newStatus === 'confirmed' && { confirmed_at: new Date().toISOString() })
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return
    }

    // Create status history record
    await this.supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        from_status: fromStatus,
        to_status: newStatus,
        changed_by: changedBy === 'system' ? null : changedBy,
        notes: changedBy === 'system' ? 'Automatic status update' : undefined
      })
  }

  /**
   * Send notification to washer about new job assignment
   */
  private async notifyWasher(match: MatchingScore, booking: BookingRequest): Promise<void> {
    const notification: NotificationPayload = {
      userId: match.washerId,
      type: 'new_job_assignment',
      title: 'New Job Available!',
      body: `A new laundry job is available near you. Match score: ${Math.round(match.totalScore)}%`,
      data: {
        bookingId: booking.id.toString(),
        matchScore: match.totalScore,
        estimatedEarnings: match.estimatedCost,
        distance: `${match.distanceKm.toFixed(1)}km`,
        travelTime: `${match.estimatedTravelTime}min`
      },
      channels: ['push', 'email']
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification to user
   */
  private async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          channels: notification.channels
        })

      if (error) {
        console.error('Error sending notification:', error)
      }
    } catch (error) {
      console.error('Error in sendNotification:', error)
    }
  }

  /**
   * Schedule automatic reassignment if washer doesn't respond
   */
  private async scheduleReassignment(
    assignmentId: string, 
    bookingId: number, 
    remainingMatches: MatchingScore[]
  ): Promise<void> {
    // In a real implementation, this would use a job queue or scheduler
    // For now, we'll rely on the handleExpiredAssignments method being called periodically
    console.log(`Scheduled reassignment for booking ${bookingId} if assignment ${assignmentId} expires`)
  }

  /**
   * Confirm booking when washer accepts
   */
  private async confirmBooking(bookingId: number, washerId: string): Promise<void> {
    // Update booking with washer assignment
    const { error } = await this.supabase
      .from('bookings')
      .update({
        washer_id: washerId,
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error confirming booking:', error)
      return
    }

    // Create status history
    await this.updateBookingStatus(bookingId, 'confirmed', washerId)

    // Notify customer
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('customer_profiles!inner(user_id)')
      .eq('id', bookingId)
      .single()

    if (booking) {
      await this.sendNotification({
        userId: booking.customer_profiles.user_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your laundry booking has been confirmed. Your washer will be in touch soon.',
        data: { bookingId: bookingId.toString() },
        channels: ['push', 'email']
      })
    }
  }

  /**
   * Cancel other pending assignments for a booking
   */
  private async cancelOtherAssignments(bookingId: number, acceptedAssignmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('washer_assignments')
      .update({
        status: 'cancelled',
        responded_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .eq('status', 'offered')
      .neq('id', acceptedAssignmentId)

    if (error) {
      console.error('Error cancelling other assignments:', error)
    }
  }

  /**
   * Handle declined assignment by trying next best match
   */
  private async handleDeclinedAssignment(bookingId: number): Promise<AssignmentResult> {
    // Get booking details and find new matches
    const booking = await this.getBookingDetails(bookingId)
    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Get washers who have already been offered this job
    const { data: previousAssignments } = await this.supabase
      .from('washer_assignments')
      .select('washer_id')
      .eq('booking_id', bookingId)

    const excludedWashers = previousAssignments?.map((a: any) => a.washer_id) || []

    // Build criteria excluding previous washers
    const criteria = await this.buildMatchingCriteria(booking)
    criteria.preferences.blockedWashers = [
      ...(criteria.preferences.blockedWashers || []),
      ...excludedWashers
    ]

    // Find new matches
    const matches = await this.matchingEngine.findBestMatches(booking, criteria)
    
    if (matches.length === 0) {
      // No more matches available - mark booking as unassigned
      await this.updateBookingStatus(bookingId, 'pending', 'system')
      return { success: false, error: 'No more available washers' }
    }

    // Assign to next best match
    const nextMatch = matches[0]
    const assignmentResult = await this.createAssignment(booking, nextMatch)
    
    if (assignmentResult.success) {
      await this.notifyWasher(nextMatch, booking)
      await this.scheduleReassignment(assignmentResult.assignmentId!, bookingId, matches.slice(1))
    }

    return assignmentResult
  }

  /**
   * Handle expired assignment
   */
  private async handleExpiredAssignment(assignmentId: string, bookingId: number): Promise<void> {
    // Mark assignment as expired
    await this.supabase
      .from('washer_assignments')
      .update({
        status: 'expired',
        responded_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    // Try to reassign
    await this.handleDeclinedAssignment(bookingId)
  }
}
'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'

export interface BookingRecord {
  id: number
  user_id: string
  created_at: string
  collection_date: string
  collection_time_slot: string
  status: string
  services_config: Record<string, unknown>
  total_price: number
  special_instructions: string | null
  stain_images: string[] | null
  washer_id: string | null
  cancellation_policy_agreed: boolean
  terms_agreed: boolean
  collection_pin: string | null
  delivery_pin: string | null
  collection_verified_at: string | null
  delivery_verified_at: string | null
}

export interface BookingWithWasher extends BookingRecord {
  washer_profile?: {
    first_name: string
    last_name: string
    phone_number: string
  } | null
}

export async function getUserBookings(): Promise<{
  success: boolean
  data?: BookingRecord[]
  message?: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found. Please log in again.',
      }
    }

    // Fetch user's bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('collection_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        message: 'Failed to fetch bookings. Please try again.',
      }
    }

    return {
      success: true,
      data: bookings || [],
    }
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function getBookingById(bookingId: string): Promise<{
  success: boolean
  data?: BookingWithWasher
  message?: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found. Please log in again.',
      }
    }

    // Fetch specific booking with security check
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id) // Security: ensure user can only access their own bookings
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        message: 'Booking not found or access denied.',
      }
    }

    // If washer is assigned, fetch washer profile
    if (booking.washer_id) {
      const { data: washerProfile, error: washerError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number')
        .eq('id', booking.washer_id)
        .single()

      if (!washerError && washerProfile) {
        const bookingWithWasher: BookingWithWasher = {
          ...booking,
          washer_profile: washerProfile,
        }
        return {
          success: true,
          data: bookingWithWasher,
        }
      }
    }

    const bookingWithWasher: BookingWithWasher = booking

    return {
      success: true,
      data: bookingWithWasher,
    }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function cancelBooking(
  bookingId: string,
  options?: { confirmNoRefund?: boolean }
): Promise<{
  success: boolean
  message: string
  code?: 'CONFIRM_NO_REFUND'
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found. Please log in again.',
      }
    }

    // Fetch the booking to check ownership and get collection date
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, collection_date, collection_time_slot, status, user_id')
      .eq('id', bookingId)
      .eq('user_id', user.id) // Security: ensure user can only cancel their own bookings
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return {
        success: false,
        message: 'Booking not found or access denied.',
      }
    }

    // Check if booking is already cancelled or completed
    if (booking.status === 'cancelled') {
      return {
        success: false,
        message: 'This booking has already been cancelled.',
      }
    }

    if (booking.status === 'completed') {
      return {
        success: false,
        message: 'Completed bookings cannot be cancelled.',
      }
    }

    // Implement 12-hour rule
    const collectionDate = new Date(booking.collection_date)
    const currentTime = new Date()
    const timeDifferenceInHours =
      (collectionDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60)

    if (timeDifferenceInHours < 12 && !options?.confirmNoRefund) {
      return {
        success: false,
        code: 'CONFIRM_NO_REFUND',
        message:
          'This booking is within 12 hours of collection and is non-refundable.',
      }
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', user.id) // Double security check

    if (updateError) {
      console.error('Database error:', updateError)
      return {
        success: false,
        message: 'Failed to update booking status.',
      }
    }

    // TODO: Handle refund logic here if applicable
    // For now, we assume Stripe handles refunds or they are done manually.
    // If timeDifferenceInHours >= 12, a refund would be processed.
    // If timeDifferenceInHours < 12, no refund is issued.

    return {
      success: true,
      message: 'Booking has been successfully cancelled.',
    }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while cancelling the booking.',
    }
  }
}

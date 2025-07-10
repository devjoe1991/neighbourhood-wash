'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface WasherBooking {
  id: number
  user_id: string
  collection_date: string
  collection_time_slot: string
  status: string
  total_price: number
  services_config: Record<string, unknown>
  special_instructions: string | null
  stain_images: string[] | null
  collection_pin: string | null
  delivery_pin: string | null
  collection_verified_at: string | null
  delivery_verified_at: string | null
  created_at: string
  user: {
    full_name: string | null
    email: string
  } | null
}

export async function getAssignedBookings(): Promise<{
  success: boolean
  data: WasherBooking[]
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
        data: [],
        message: 'Authentication error. Please log in again.',
      }
    }

    if (!user) {
      return {
        success: false,
        data: [],
        message: 'User not found. Please log in again.',
      }
    }

    // Fetch bookings assigned to this washer
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        user_id,
        collection_date,
        collection_time_slot,
        status,
        total_price,
        services_config,
        special_instructions,
        stain_images,
        collection_pin,
        delivery_pin,
        collection_verified_at,
        delivery_verified_at,
        created_at,
        profiles!user_id (
          full_name,
          email
        )
      `
      )
      .eq('washer_id', user.id)
      .order('collection_date', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch assigned bookings.',
      }
    }

    // Format the data
    const formattedBookings: WasherBooking[] = bookings.map((booking) => {
      const profile = Array.isArray(booking.profiles)
        ? booking.profiles[0]
        : booking.profiles
      return {
        id: booking.id,
        user_id: booking.user_id,
        collection_date: booking.collection_date,
        collection_time_slot: booking.collection_time_slot,
        status: booking.status,
        total_price: booking.total_price,
        services_config: booking.services_config,
        special_instructions: booking.special_instructions,
        stain_images: booking.stain_images,
        collection_pin: booking.collection_pin,
        delivery_pin: booking.delivery_pin,
        collection_verified_at: booking.collection_verified_at,
        delivery_verified_at: booking.delivery_verified_at,
        created_at: booking.created_at,
        user: profile,
      }
    })

    return {
      success: true,
      data: formattedBookings,
    }
  } catch (error) {
    console.error('Error fetching assigned bookings:', error)
    return {
      success: false,
      data: [],
      message: 'An unexpected error occurred.',
    }
  }
}

export async function getBookingDetails(bookingId: number): Promise<{
  success: boolean
  data: WasherBooking | null
  message?: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        data: null,
        message: 'Authentication error. Please log in again.',
      }
    }

    // Fetch specific booking assigned to this washer
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        user_id,
        collection_date,
        collection_time_slot,
        status,
        total_price,
        services_config,
        special_instructions,
        stain_images,
        collection_pin,
        delivery_pin,
        collection_verified_at,
        delivery_verified_at,
        created_at,
        profiles!user_id (
          full_name,
          email
        )
      `
      )
      .eq('id', bookingId)
      .eq('washer_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        data: null,
        message: 'Booking not found or not assigned to you.',
      }
    }

    // Format the data
    const profile = Array.isArray(booking.profiles)
      ? booking.profiles[0]
      : booking.profiles
    const formattedBooking: WasherBooking = {
      id: booking.id,
      user_id: booking.user_id,
      collection_date: booking.collection_date,
      collection_time_slot: booking.collection_time_slot,
      status: booking.status,
      total_price: booking.total_price,
      services_config: booking.services_config,
      special_instructions: booking.special_instructions,
      stain_images: booking.stain_images,
      collection_pin: booking.collection_pin,
      delivery_pin: booking.delivery_pin,
      collection_verified_at: booking.collection_verified_at,
      delivery_verified_at: booking.delivery_verified_at,
      created_at: booking.created_at,
      user: profile,
    }

    return {
      success: true,
      data: formattedBooking,
    }
  } catch (error) {
    console.error('Error fetching booking details:', error)
    return {
      success: false,
      data: null,
      message: 'An unexpected error occurred.',
    }
  }
}

export async function getAvailableBookings(): Promise<{
  success: boolean
  data: Array<{
    id: number
    collection_date: string
    collection_time_slot: string
    total_price: number
    services_config: Record<string, unknown>
    special_instructions: string | null
    created_at: string
    user: {
      first_name: string
      last_name: string
      postcode: string
    }
  }>
  message?: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user (washer)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        data: [],
        message: 'Authentication error. Please log in again.',
      }
    }

    // Get washer's location/service area to find nearby bookings
    // For now, get all awaiting_assignment bookings
    // In production, you'd filter by location/service area
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        collection_date,
        collection_time_slot,
        total_price,
        services_config,
        special_instructions,
        created_at,
        user_id,
        profiles!fk_bookings_user_id(
          full_name,
          first_name,
          last_name,
          postcode
        )
      `
      )
      .eq('status', 'awaiting_assignment')
      .order('collection_date', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch available bookings.',
      }
    }

    // Format the data for the frontend
    const formattedBookings = bookings.map((booking) => {
      const profile = Array.isArray(booking.profiles)
        ? booking.profiles[0]
        : booking.profiles

      // Handle name formatting - use first_name/last_name if available, otherwise split full_name
      let firstName = 'Customer'
      let lastName = 'User'

      if (profile?.first_name && profile?.last_name) {
        firstName = profile.first_name
        lastName = profile.last_name
      } else if (profile?.full_name) {
        const nameParts = profile.full_name.split(' ')
        firstName = nameParts[0] || 'Customer'
        lastName = nameParts.slice(1).join(' ') || 'User'
      }

      return {
        id: booking.id,
        collection_date: booking.collection_date,
        collection_time_slot: booking.collection_time_slot,
        total_price: booking.total_price,
        services_config: booking.services_config,
        special_instructions: booking.special_instructions,
        created_at: booking.created_at,
        user: {
          first_name: firstName,
          last_name: lastName,
          postcode: profile?.postcode || 'Unknown',
        },
      }
    })

    return {
      success: true,
      data: formattedBookings,
    }
  } catch (error) {
    console.error('Error fetching available bookings:', error)
    return {
      success: false,
      data: [],
      message: 'An unexpected error occurred.',
    }
  }
}

export async function acceptBooking(bookingId: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user (washer)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    // Check if booking is still available
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, washer_id')
      .eq('id', bookingId)
      .eq('status', 'awaiting_assignment')
      .single()

    if (fetchError || !booking) {
      return {
        success: false,
        message: 'Booking is no longer available or already assigned.',
      }
    }

    // Assign the washer to the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        washer_id: user.id,
        status: 'washer_assigned',
      })
      .eq('id', bookingId)
      .eq('status', 'awaiting_assignment') // Double-check it's still available

    if (updateError) {
      console.error('Database error:', updateError)
      return {
        success: false,
        message:
          'Failed to accept booking. It may have been claimed by another washer.',
      }
    }

    revalidatePath('/washer/dashboard/bookings')
    revalidatePath('/washer/dashboard/available-bookings')

    return {
      success: true,
      message:
        'Booking accepted successfully! You can now view it in your bookings.',
    }
  } catch (error) {
    console.error('Error accepting booking:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

export async function verifyPin(
  bookingId: number,
  pinType: 'collection' | 'delivery',
  submittedPin: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(submittedPin)) {
      return {
        success: false,
        message: 'PIN must be a 4-digit number.',
      }
    }

    // Fetch the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        'id, washer_id, collection_pin, delivery_pin, collection_verified_at, delivery_verified_at, status'
      )
      .eq('id', bookingId)
      .eq('washer_id', user.id)
      .single()

    if (fetchError || !booking) {
      return {
        success: false,
        message: 'Booking not found or not assigned to you.',
      }
    }

    // Get the correct PIN based on type
    const correctPin =
      pinType === 'collection' ? booking.collection_pin : booking.delivery_pin
    const verificationField =
      pinType === 'collection'
        ? 'collection_verified_at'
        : 'delivery_verified_at'
    const currentVerification =
      pinType === 'collection'
        ? booking.collection_verified_at
        : booking.delivery_verified_at

    // Check if already verified
    if (currentVerification) {
      return {
        success: false,
        message: `${pinType === 'collection' ? 'Collection' : 'Delivery'} has already been verified.`,
      }
    }

    // Validate PIN
    if (submittedPin !== correctPin) {
      return {
        success: false,
        message: 'Incorrect PIN. Please try again.',
      }
    }

    // Determine new status
    let newStatus = booking.status
    if (pinType === 'collection') {
      newStatus = 'in_progress'
    } else if (pinType === 'delivery') {
      newStatus = 'completed'
    }

    // Update the booking
    const updateData: Record<string, string> = {
      [verificationField]: new Date().toISOString(),
      status: newStatus,
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)

    if (updateError) {
      console.error('Update error:', updateError)
      return {
        success: false,
        message: 'Failed to verify PIN. Please try again.',
      }
    }

    // Revalidate relevant pages
    revalidatePath('/washer/dashboard/bookings')
    revalidatePath(`/washer/dashboard/bookings/${bookingId}`)
    revalidatePath('/dashboard/my-bookings') // For user's page

    return {
      success: true,
      message: `${pinType === 'collection' ? 'Collection' : 'Delivery'} confirmed successfully!`,
    }
  } catch (error) {
    console.error('Error verifying PIN:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

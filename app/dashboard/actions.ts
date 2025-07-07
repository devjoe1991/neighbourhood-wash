'use server'

import { createClient } from '@/utils/supabase/server_new'
import { revalidatePath } from 'next/cache'

export interface CompletedBookingNeedingReview {
  id: number
  user_id: string
  washer_id: string | null
  collection_date: string
  collection_time_slot: string
  total_price: number
  status: string
  washer_name: string | null
  washer_email: string | null
}

export interface ReviewData {
  bookingId: number
  washerId: string
  rating: number
  comment: string
}

export async function getCompletedBookingsNeedingReview(): Promise<{
  success: boolean
  data: CompletedBookingNeedingReview[]
  message?: string
}> {
  try {
    const supabase = createClient()

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

    // Query for completed bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        user_id,
        washer_id,
        collection_date,
        collection_time_slot,
        total_price,
        status,
        profiles:washer_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('collection_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch completed bookings.',
      }
    }

    // Get existing reviews for these bookings
    const bookingIds = bookings.map((booking) => booking.id)
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds)

    if (reviewsError) {
      console.error('Reviews error:', reviewsError)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch existing reviews.',
      }
    }

    // Filter out bookings that already have reviews
    const reviewedBookingIds = new Set(
      existingReviews.map((review) => review.booking_id)
    )
    const unreviewed = bookings.filter(
      (booking) => !reviewedBookingIds.has(booking.id)
    )

    // Format the data
    const formattedBookings: CompletedBookingNeedingReview[] = unreviewed.map(
      (booking) => {
        const profile = Array.isArray(booking.profiles)
          ? booking.profiles[0]
          : booking.profiles
        return {
          id: booking.id,
          user_id: booking.user_id,
          washer_id: booking.washer_id,
          collection_date: booking.collection_date,
          collection_time_slot: booking.collection_time_slot,
          total_price: booking.total_price,
          status: booking.status,
          washer_name:
            profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : null,
          washer_email: profile?.email || null,
        }
      }
    )

    return {
      success: true,
      data: formattedBookings,
    }
  } catch (error) {
    console.error('Error fetching completed bookings:', error)
    return {
      success: false,
      data: [],
      message: 'An unexpected error occurred.',
    }
  }
}

export async function submitReview(reviewData: ReviewData): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()

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

    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return {
        success: false,
        message: 'Rating must be between 1 and 5 stars.',
      }
    }

    // Verify the booking belongs to the user and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, status, washer_id')
      .eq('id', reviewData.bookingId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single()

    if (bookingError || !booking) {
      return {
        success: false,
        message: 'Booking not found or not eligible for review.',
      }
    }

    if (booking.washer_id !== reviewData.washerId) {
      return {
        success: false,
        message: 'Invalid washer for this booking.',
      }
    }

    // Check if review already exists
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', reviewData.bookingId)
      .single()

    if (reviewCheckError && reviewCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Review check error:', reviewCheckError)
      return {
        success: false,
        message: 'Error checking existing review.',
      }
    }

    if (existingReview) {
      return {
        success: false,
        message: 'This booking has already been reviewed.',
      }
    }

    // Insert the review
    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: reviewData.bookingId,
      user_id: user.id,
      washer_id: reviewData.washerId,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return {
        success: false,
        message: 'Failed to submit review. Please try again.',
      }
    }

    // Revalidate the dashboard page to update the UI
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Review submitted successfully!',
    }
  } catch (error) {
    console.error('Error submitting review:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

export async function addFavouriteWasher(washerId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()

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

    // Check if washer is already a favourite
    const { data: existingFavourite, error: checkError } = await supabase
      .from('favourite_washers')
      .select('id')
      .eq('user_id', user.id)
      .eq('washer_id', washerId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Favourite check error:', checkError)
      return {
        success: false,
        message: 'Error checking existing favourite.',
      }
    }

    if (existingFavourite) {
      return {
        success: false,
        message: 'This washer is already in your favourites.',
      }
    }

    // Add to favourites
    const { error: insertError } = await supabase
      .from('favourite_washers')
      .insert({
        user_id: user.id,
        washer_id: washerId,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return {
        success: false,
        message: 'Failed to add washer to favourites. Please try again.',
      }
    }

    // Revalidate the dashboard page to update the UI
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Washer added to favourites!',
    }
  } catch (error) {
    console.error('Error adding favourite washer:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

export async function checkIfWasherIsFavourite(washerId: string): Promise<{
  success: boolean
  isFavourite: boolean
  message?: string
}> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        isFavourite: false,
        message: 'Authentication error.',
      }
    }

    // Check if washer is in favourites
    const { data: favourite, error } = await supabase
      .from('favourite_washers')
      .select('id')
      .eq('user_id', user.id)
      .eq('washer_id', washerId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Favourite check error:', error)
      return {
        success: false,
        isFavourite: false,
        message: 'Error checking favourite status.',
      }
    }

    return {
      success: true,
      isFavourite: !!favourite,
    }
  } catch (error) {
    console.error('Error checking favourite washer:', error)
    return {
      success: false,
      isFavourite: false,
      message: 'An unexpected error occurred.',
    }
  }
}

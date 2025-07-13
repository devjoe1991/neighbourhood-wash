'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { WeightTier, AddOn, ItemKey } from '@/lib/pricing'
import { generatePin } from '@/lib/utils'

export interface BookingData {
  // Step 1: Schedule
  date: Date
  timeSlot: string | null
  deliveryMethod: 'collection' | 'drop-off'

  // Step 2: Services
  weightTier: WeightTier | null
  selectedItems: { [key in ItemKey]?: number }
  selectedAddOns: AddOn[]

  // Step 3: Details
  specialInstructions: string
  stainImageUrls: string[]
  accessNotes: string

  // Step 4: Payment
  totalPrice: number
  paymentIntentId?: string
  washer_id?: string // Add washer_id as an optional field
}

export interface BookingResult {
  success: boolean
  message: string
  bookingId?: number
}

export async function createBooking(
  bookingData: BookingData
): Promise<BookingResult> {
  try {
    console.log('Creating booking with data:', bookingData)

    // Create server-side Supabase client
    const supabase = createSupabaseServerClient()

    // Get current user with enhanced error logging
    console.log('🔍 Attempting to get user from server-side client...')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      console.error('Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })
      return {
        success: false,
        message: 'Authentication error. Please log in again.',
      }
    }

    if (!user) {
      console.error('No user returned from auth.getUser()')
      return {
        success: false,
        message: 'User not found. Please log in again.',
      }
    }

    console.log('✅ User authenticated successfully:', user.id)

    // Prepare services configuration for database
    const servicesConfig = {
      weightTier: bookingData.weightTier,
      selectedItems: bookingData.selectedItems,
      selectedAddOns: bookingData.selectedAddOns,
    }

    // Generate unique PINs for secure handovers
    const collectionPin = generatePin()
    let deliveryPin = generatePin()

    // Ensure PINs are different (very unlikely but worth checking)
    while (deliveryPin === collectionPin) {
      deliveryPin = generatePin()
    }

    // Create booking record
    const newBooking = {
      user_id: user.id,
      collection_date: bookingData.date.toISOString(),
      collection_time_slot: bookingData.timeSlot,
      delivery_method: bookingData.deliveryMethod,
      services_config: servicesConfig,
      total_price: bookingData.totalPrice,
      special_instructions: bookingData.specialInstructions || null,
      stain_images: bookingData.stainImageUrls,
      status: 'pending_washer_assignment', // Corrected status
      cancellation_policy_agreed: true,
      terms_agreed: true,
      collection_pin: collectionPin,
      delivery_pin: deliveryPin,
      payment_intent_id: bookingData.paymentIntentId || null,
      access_notes: bookingData.accessNotes || null,
    }

    console.log('📝 Attempting to insert booking into database...')
    console.log('Booking data structure:', {
      user_id: user.id,
      collection_date: bookingData.date.toISOString(),
      collection_time_slot: bookingData.timeSlot,
      delivery_method: bookingData.deliveryMethod,
      total_price: bookingData.totalPrice,
      status: 'pending_washer_assignment', // Corrected status
    })

    // Insert booking into database
    const { data, error } = await supabase
      .from('bookings')
      .insert(newBooking)
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return {
        success: false,
        message: 'Failed to save booking. Please try again.',
      }
    }

    console.log('✅ Booking created successfully:', data)

    // Payment processing completed via Stripe before booking creation
    // TODO: Send notifications to user and system
    // TODO: Trigger washer assignment algorithm

    // Return success status - redirect will be handled by the client
    return {
      success: true,
      bookingId: data.id,
      message: 'Booking created successfully!',
    }
  } catch (error) {
    console.error('Error creating booking:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function createCheckoutSession(
  bookingId: number,
  washerId: string, // The assigned washer's user ID
  totalPrice: number
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, message: 'Authentication failed.' }
    }

    // 1. Get the washer's Stripe Connect account ID from their profile
    const { data: washerProfile, error: washerProfileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, email')
      .eq('id', washerId)
      .single()

    if (washerProfileError || !washerProfile) {
      return { success: false, message: 'Washer profile not found.' }
    }

    if (!washerProfile.stripe_account_id) {
      // This is a critical issue. The assigned washer must have a connected Stripe account.
      // In a real scenario, the washer assignment logic should prevent this.
      console.error(
        `Critical: Washer ${washerId} does not have a Stripe account connected.`
      )
      return {
        success: false,
        message:
          'The assigned washer is not set up to receive payments. Please contact support.',
      }
    }

    const stripe = (await import('@/lib/stripe/server')).stripe
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    // 2. Calculate commission (e.g., 15%)
    // Stripe expects amounts in the smallest currency unit (e.g., pence for GBP)
    const priceInPence = Math.round(totalPrice * 100)
    const commissionInPence = Math.round(priceInPence * 0.15) // 15% platform fee

    // 3. Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Neighbourhood Wash Service (Booking #${bookingId})`,
              description:
                'Complete laundry service including wash, dry, and fold.',
            },
            unit_amount: priceInPence,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/user/dashboard/my-bookings/${bookingId}?payment_success=true`,
      cancel_url: `${siteUrl}/user/dashboard/my-bookings/${bookingId}?payment_cancelled=true`,
      customer_email: user.email,
      metadata: {
        bookingId: bookingId,
        userId: user.id,
        washerId: washerId,
      },
      // This is the core of the Connect integration for payments
      payment_intent_data: {
        application_fee_amount: commissionInPence,
        transfer_data: {
          destination: washerProfile.stripe_account_id,
        },
      },
    })

    if (!session.url) {
      return {
        success: false,
        message: 'Could not create Stripe checkout session.',
      }
    }

    // 4. Optionally, store the checkout session ID on the booking for reference
    await supabase
      .from('bookings')
      .update({ payment_intent_id: session.id }) // Using payment_intent_id to store session id
      .eq('id', bookingId)

    return {
      success: true,
      message: 'Checkout session created.',
      url: session.url,
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while setting up payment.',
    }
  }
}

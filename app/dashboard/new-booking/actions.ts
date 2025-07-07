'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server_new'
import { WeightTier, SpecialItem, AddOn, serviceConfig } from '@/lib/pricing'
import { generatePin } from '@/lib/utils'

export interface BookingData {
  // Step 1: Schedule
  date: Date
  timeSlot: string

  // Step 2: Services
  weightTier: WeightTier
  selectedItems: SpecialItem[]
  selectedAddOns: AddOn[]

  // Step 3: Details
  specialInstructions: string
  stainImageUrls: string[]
  accessNotes: string

  // Step 4: Payment
  totalPrice: number
  paymentIntentId?: string
}

export async function createBooking(bookingData: BookingData) {
  try {
    console.log('Creating booking with data:', bookingData)

    // Create server-side Supabase client
    const supabase = createClient()

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
      baseService: serviceConfig.baseWashDry[bookingData.weightTier],
      selectedItems: bookingData.selectedItems.map((item) => ({
        key: item,
        ...serviceConfig.specialItems[item],
      })),
      selectedAddOns: bookingData.selectedAddOns.map((addon) => ({
        key: addon,
        ...serviceConfig.addOns[addon],
      })),
      collectionFee: serviceConfig.collectionFee,
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
      services_config: servicesConfig,
      total_price: bookingData.totalPrice,
      special_instructions: bookingData.specialInstructions || null,
      stain_images: bookingData.stainImageUrls,
      status: 'awaiting_assignment',
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
      total_price: bookingData.totalPrice,
      status: 'awaiting_assignment',
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

    // Redirect to confirmation page
    redirect(`/dashboard/booking-confirmation/${data.id}`)
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

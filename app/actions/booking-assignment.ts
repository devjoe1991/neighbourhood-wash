/**
 * Server actions for booking assignment functionality
 */

'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { JobAssignmentService } from '@/lib/booking/assignment-service'
import { BookingLifecycleService } from '@/lib/booking/lifecycle-service'
import { redirect } from 'next/navigation'

export async function assignBookingAction(bookingId: number) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const isAdmin = userRoles?.some((role: any) => role.role === 'admin')
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const assignmentService = new JobAssignmentService()
    const result = await assignmentService.assignBooking(bookingId)

    return result
  } catch (error) {
    console.error('Error in assignBookingAction:', error)
    return { success: false, error: 'Failed to assign booking' }
  }
}

export async function respondToAssignmentAction(
  assignmentId: string,
  response: 'accepted' | 'declined'
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is a washer
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const isWasher = userRoles?.some((role: any) => role.role === 'washer')
    if (!isWasher) {
      return { success: false, error: 'Only washers can respond to assignments' }
    }

    // Get washer profile
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (washerError || !washerProfile) {
      return { success: false, error: 'Washer profile not found' }
    }

    const assignmentService = new JobAssignmentService()
    const result = await assignmentService.handleWasherResponse(
      assignmentId,
      washerProfile.id,
      response
    )

    return result
  } catch (error) {
    console.error('Error in respondToAssignmentAction:', error)
    return { success: false, error: 'Failed to process response' }
  }
}

export async function createBookingAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      redirect('/signin')
    }

    // Check if user is a customer
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const isCustomer = userRoles?.some((role: any) => role.role === 'customer')
    if (!isCustomer) {
      return { success: false, error: 'Only customers can create bookings' }
    }

    // Get customer profile
    const { data: customerProfile, error: customerError } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customerProfile) {
      return { success: false, error: 'Customer profile not found' }
    }

    // Extract form data
    const serviceType = formData.get('serviceType') as string
    const serviceDescription = formData.get('serviceDescription') as string
    const requestedDate = formData.get('requestedDate') as string
    const pickupAddress = JSON.parse(formData.get('pickupAddress') as string)
    const basePrice = parseFloat(formData.get('basePrice') as string)

    const bookingData = {
      customerId: user.id,
      serviceType,
      serviceDescription,
      requestedDate,
      pickupAddress,
      items: [
        {
          itemType: 'mixed',
          quantity: 1
        }
      ],
      basePrice
    }

    const lifecycleService = new BookingLifecycleService()
    const result = await lifecycleService.createBooking(bookingData)

    if (result.success) {
      redirect(`/user/dashboard/my-bookings/${result.bookingId}`)
    }

    return result
  } catch (error) {
    console.error('Error in createBookingAction:', error)
    return { success: false, error: 'Failed to create booking' }
  }
}

export async function getBookingDetailsAction(bookingId: number) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const lifecycleService = new BookingLifecycleService()
    const booking = await lifecycleService.getBookingDetails(bookingId)

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Check if user has access to this booking
    const hasAccess = 
      booking.customer_profiles?.user_id === user.id ||
      booking.washer_profiles?.user_id === user.id ||
      // Check if admin
      (await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .single()).data

    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, data: booking }
  } catch (error) {
    console.error('Error in getBookingDetailsAction:', error)
    return { success: false, error: 'Failed to get booking details' }
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer profile
    const { data: customerProfile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Get the most recent active booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        service_type,
        requested_date,
        requested_time_start,
        pickup_address,
        total_price,
        created_at,
        washer_profiles(
          id,
          user_id,
          profiles(
            full_name,
            phone_number
          )
        )
      `)
      .eq('customer_id', customerProfile.id)
      .in('status', ['pending', 'assigned', 'confirmed', 'in_progress', 'pickup_complete', 'washing', 'ready_for_delivery', 'out_for_delivery'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching active booking:', error)
      return NextResponse.json({ error: 'Failed to fetch active booking' }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({
        success: true,
        booking: null
      })
    }

    // Calculate progress percentage based on status
    const getProgressPercentage = (status: string): number => {
      const statusMap: Record<string, number> = {
        'pending': 10,
        'assigned': 25,
        'confirmed': 40,
        'in_progress': 60,
        'pickup_complete': 70,
        'washing': 80,
        'ready_for_delivery': 90,
        'out_for_delivery': 95,
        'completed': 100
      }
      return statusMap[status] || 0
    }

    // Transform data to match expected format
    const transformedBooking = {
      id: booking.id,
      status: booking.status,
      service_type: booking.service_type,
      requested_date: booking.requested_date,
      requested_time_start: booking.requested_time_start,
      pickup_address: booking.pickup_address,
      total_price: booking.total_price,
      washer: booking.washer_profiles ? {
        id: booking.washer_profiles.id,
        name: booking.washer_profiles.profiles?.full_name || 'Unknown',
        rating: 4.5, // TODO: Calculate actual rating
        phone: booking.washer_profiles.profiles?.phone_number
      } : null,
      estimated_completion: null, // TODO: Calculate based on service type and current status
      progress_percentage: getProgressPercentage(booking.status)
    }

    return NextResponse.json({
      success: true,
      booking: transformedBooking
    })

  } catch (error) {
    console.error('Error in active booking API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
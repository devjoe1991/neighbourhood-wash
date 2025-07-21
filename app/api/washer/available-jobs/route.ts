import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const washerId = searchParams.get('washerId')

    if (!washerId) {
      return NextResponse.json({ error: 'Washer ID required' }, { status: 400 })
    }

    // Get available job assignments for this washer
    const { data: assignments, error } = await supabase
      .from('washer_assignments')
      .select(`
        id,
        booking_id,
        match_score,
        distance_km,
        estimated_travel_time_minutes,
        status,
        offered_at,
        expires_at,
        bookings!inner (
          id,
          service_type,
          service_description,
          requested_date,
          requested_time_start,
          pickup_address,
          total_price,
          customer_profiles!inner (
            profiles!inner (
              full_name
            )
          )
        )
      `)
      .eq('washer_id', washerId)
      .eq('status', 'offered')
      .gt('expires_at', new Date().toISOString())
      .order('offered_at', { ascending: false })

    if (error) {
      console.error('Error fetching available jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const jobs = assignments?.map((assignment: any) => ({
      id: assignment.id,
      booking_id: assignment.booking_id,
      match_score: assignment.match_score,
      distance_km: assignment.distance_km,
      estimated_travel_time_minutes: assignment.estimated_travel_time_minutes,
      status: assignment.status,
      offered_at: assignment.offered_at,
      expires_at: assignment.expires_at,
      booking: {
        id: assignment.bookings.id,
        service_type: assignment.bookings.service_type,
        service_description: assignment.bookings.service_description,
        requested_date: assignment.bookings.requested_date,
        requested_time_start: assignment.bookings.requested_time_start,
        pickup_address: assignment.bookings.pickup_address,
        total_price: assignment.bookings.total_price,
        customer: {
          full_name: assignment.bookings.customer_profiles.profiles.full_name,
          rating: 4.5 // Default rating for now
        }
      }
    })) || []

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error in available-jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
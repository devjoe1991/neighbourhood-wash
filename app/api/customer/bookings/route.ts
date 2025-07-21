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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'date_desc'

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        service_type,
        service_description,
        requested_date,
        requested_time_start,
        pickup_address,
        total_price,
        created_at,
        washer_profiles!inner(
          id,
          user_id,
          profiles!inner(
            full_name
          )
        )
      `)
      .eq('customer_id', customerProfile.id)

    // Apply filters
    if (activeOnly) {
      query = query.in('status', ['pending', 'assigned', 'confirmed', 'in_progress', 'pickup_complete', 'washing', 'ready_for_delivery', 'out_for_delivery'])
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`service_type.ilike.%${search}%,service_description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case 'date_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'price_desc':
        query = query.order('total_price', { ascending: false })
        break
      case 'price_asc':
        query = query.order('total_price', { ascending: true })
        break
      case 'status':
        query = query.order('status')
        break
      default: // date_desc
        query = query.order('created_at', { ascending: false })
    }

    query = query.limit(limit)

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedBookings = bookings?.map((booking: any) => ({
      id: booking.id,
      status: booking.status,
      service_type: booking.service_type,
      service_description: booking.service_description,
      requested_date: booking.requested_date,
      requested_time_start: booking.requested_time_start,
      pickup_address: booking.pickup_address,
      total_price: booking.total_price,
      created_at: booking.created_at,
      washer: booking.washer_profiles ? {
        id: booking.washer_profiles.id,
        name: booking.washer_profiles.profiles?.full_name || 'Unknown',
        rating: 4.5 // TODO: Calculate actual rating
      } : null,
      unread_messages: 0 // TODO: Calculate actual unread messages
    })) || []

    return NextResponse.json({
      success: true,
      bookings: transformedBookings
    })

  } catch (error) {
    console.error('Error in customer bookings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFilter = searchParams.get('date_filter') || 'all'
    const sort = searchParams.get('sort') || 'date_desc'

    const offset = (page - 1) * limit

    // Build date filter
    let dateFilterClause = ''
    const now = new Date()
    switch (dateFilter) {
      case 'last_week':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilterClause = `created_at >= '${lastWeek.toISOString()}'`
        break
      case 'last_month':
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilterClause = `created_at >= '${lastMonth.toISOString()}'`
        break
      case 'last_3_months':
        const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilterClause = `created_at >= '${last3Months.toISOString()}'`
        break
      case 'last_year':
        const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        dateFilterClause = `created_at >= '${lastYear.toISOString()}'`
        break
    }

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
        completed_at,
        cancelled_at,
        washer_profiles(
          id,
          user_id,
          profiles(
            full_name
          )
        ),
        reviews(
          id,
          rating,
          comment
        )
      `, { count: 'exact' })
      .eq('customer_id', customerProfile.id)
      .in('status', ['completed', 'cancelled', 'refunded'])

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`service_type.ilike.%${search}%,service_description.ilike.%${search}%`)
    }

    if (dateFilterClause) {
      query = query.filter('created_at', 'gte', dateFilterClause.split("'")[1])
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
      case 'rating_desc':
        query = query.order('reviews.rating', { ascending: false })
        break
      default: // date_desc
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: bookings, error, count } = await query

    if (error) {
      console.error('Error fetching booking history:', error)
      return NextResponse.json({ error: 'Failed to fetch booking history' }, { status: 500 })
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
      completed_at: booking.completed_at,
      cancelled_at: booking.cancelled_at,
      washer: booking.washer_profiles ? {
        id: booking.washer_profiles.id,
        name: booking.washer_profiles.profiles?.full_name || 'Unknown',
        rating: 4.5 // TODO: Calculate actual rating
      } : null,
      review: booking.reviews && booking.reviews.length > 0 ? {
        id: booking.reviews[0].id,
        rating: booking.reviews[0].rating,
        comment: booking.reviews[0].comment
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      total: count || 0,
      page,
      limit
    })

  } catch (error) {
    console.error('Error in booking history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
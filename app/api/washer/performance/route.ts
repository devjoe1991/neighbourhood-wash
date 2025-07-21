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

    // Get washer profile for basic metrics
    const { data: washerProfile, error: profileError } = await supabase
      .from('washer_profiles')
      .select('*')
      .eq('id', washerId)
      .single()

    if (profileError || !washerProfile) {
      return NextResponse.json({ error: 'Washer profile not found' }, { status: 404 })
    }

    // Get recent reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        service_quality_rating,
        communication_rating,
        timeliness_rating,
        created_at,
        bookings!inner (
          service_type,
          customer_profiles!inner (
            profiles!inner (
              full_name
            )
          )
        )
      `)
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate rating breakdown
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalServiceQuality = 0
    let totalCommunication = 0
    let totalTimeliness = 0
    let reviewCount = 0

    if (reviews) {
      reviews.forEach((review: any) => {
        ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++
        if (review.service_quality_rating) totalServiceQuality += review.service_quality_rating
        if (review.communication_rating) totalCommunication += review.communication_rating
        if (review.timeliness_rating) totalTimeliness += review.timeliness_rating
        reviewCount++
      })
    }

    // Get booking statistics for performance metrics
    const { data: bookingStats, error: statsError } = await supabase
      .from('bookings')
      .select('status, created_at, assigned_at, completed_at')
      .eq('washer_id', washerId)

    let avgResponseTime = 0
    let onTimeCount = 0
    let completedCount = 0

    if (bookingStats) {
      const responseTimes: number[] = []
      
      bookingStats.forEach((booking: any) => {
        if (booking.assigned_at && booking.created_at) {
          const responseTime = new Date(booking.assigned_at).getTime() - new Date(booking.created_at).getTime()
          responseTimes.push(responseTime / (1000 * 60)) // Convert to minutes
        }
        
        if (booking.status === 'completed') {
          completedCount++
          // For now, assume all completed jobs were on time
          onTimeCount++
        }
      })

      avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0
    }

    const performanceData = {
      ratings: {
        overall: washerProfile.rating || 0,
        service_quality: reviewCount > 0 ? totalServiceQuality / reviewCount : 0,
        communication: reviewCount > 0 ? totalCommunication / reviewCount : 0,
        timeliness: reviewCount > 0 ? totalTimeliness / reviewCount : 0,
        breakdown: ratingBreakdown
      },
      metrics: {
        response_time_avg: avgResponseTime,
        completion_rate: washerProfile.total_jobs > 0 
          ? (washerProfile.completed_jobs / washerProfile.total_jobs) * 100 
          : 0,
        repeat_customer_rate: 75, // Mock data for now
        on_time_rate: completedCount > 0 ? (onTimeCount / completedCount) * 100 : 0
      },
      goals: {
        monthly_jobs: { target: 20, current: washerProfile.completed_jobs },
        rating_target: { target: 4.5, current: washerProfile.rating || 0 },
        earnings_target: { target: 1000, current: 750 } // Mock data
      },
      recent_reviews: (reviews || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || '',
        customer_name: review.bookings.customer_profiles.profiles.full_name,
        date: review.created_at,
        service_type: review.bookings.service_type
      }))
    }

    return NextResponse.json(performanceData)
  } catch (error) {
    console.error('Error in performance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
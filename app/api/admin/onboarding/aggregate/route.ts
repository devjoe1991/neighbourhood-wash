import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { aggregateOnboardingData, aggregateLastNDays } from '@/lib/onboarding-analytics'

/**
 * API endpoint for triggering onboarding analytics aggregation
 * Requirements: 9.1, 9.3, 9.4 - Analytics aggregation
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get request parameters
    const body = await request.json().catch(() => ({}))
    const { date, days, hour } = body

    let result

    if (days) {
      // Aggregate last N days
      result = await aggregateLastNDays(parseInt(days))
    } else if (date) {
      // Aggregate specific date
      result = await aggregateOnboardingData(date, hour ? parseInt(hour) : undefined)
    } else {
      // Aggregate today by default
      const today = new Date().toISOString().split('T')[0]
      result = await aggregateOnboardingData(today)
    }

    if (!result.success) {
      const errorMessage = 'error' in result ? result.error : 'Failed to aggregate data'
      return NextResponse.json(
        { error: errorMessage || 'Failed to aggregate data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics data aggregated successfully',
      data: 'data' in result ? result.data : { 
        processed: 'processed' in result ? result.processed : 0, 
        errors: 'errors' in result ? result.errors : [] 
      }
    })
  } catch (error) {
    console.error('API error aggregating analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
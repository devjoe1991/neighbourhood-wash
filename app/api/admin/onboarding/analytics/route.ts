import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getOnboardingAnalytics } from '@/lib/onboarding-progress'

/**
 * API endpoint for onboarding analytics
 * Requirements: 9.1, 9.3, 9.4 - Admin interface for monitoring onboarding progress
 */

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeHourly = searchParams.get('includeHourly') === 'true'

    // Get onboarding analytics
    const analyticsResult = await getOnboardingAnalytics(
      startDate || undefined,
      endDate || undefined,
      includeHourly
    )

    if (!analyticsResult.success) {
      console.error('Error getting onboarding analytics:', analyticsResult.error)
      return NextResponse.json(
        { error: 'Failed to retrieve onboarding analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json(analyticsResult.data)
  } catch (error) {
    console.error('API error getting onboarding analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getOnboardingStats } from '@/lib/onboarding-progress'

/**
 * API endpoint for onboarding statistics
 * Requirements: 9.1, 9.3, 9.4 - Admin interface for monitoring onboarding progress
 */

export async function GET(_request: NextRequest) {
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

    // Get onboarding statistics
    const statsResult = await getOnboardingStats()

    if (!statsResult.success) {
      console.error('Error getting onboarding stats:', statsResult.error)
      return NextResponse.json(
        { error: 'Failed to retrieve onboarding statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json(statsResult.data)
  } catch (error) {
    console.error('API error getting onboarding stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
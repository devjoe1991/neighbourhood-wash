/**
 * API endpoint for washer responses to job assignments
 * POST /api/bookings/respond
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { JobAssignmentService } from '@/lib/booking/assignment-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a washer
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const isWasher = userRoles?.some((role: any) => role.role === 'washer')
    if (!isWasher) {
      return NextResponse.json({ error: 'Only washers can respond to assignments' }, { status: 403 })
    }

    // Get washer profile
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (washerError || !washerProfile) {
      return NextResponse.json({ error: 'Washer profile not found' }, { status: 404 })
    }

    const { assignmentId, response } = await request.json()

    if (!assignmentId || !response) {
      return NextResponse.json({ 
        error: 'Assignment ID and response are required' 
      }, { status: 400 })
    }

    if (!['accepted', 'declined'].includes(response)) {
      return NextResponse.json({ 
        error: 'Response must be either "accepted" or "declined"' 
      }, { status: 400 })
    }

    const assignmentService = new JobAssignmentService()
    const result = await assignmentService.handleWasherResponse(
      assignmentId,
      washerProfile.id,
      response
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: response === 'accepted' ? 'Job accepted successfully' : 'Job declined',
        assignmentId: result.assignmentId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in washer response API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
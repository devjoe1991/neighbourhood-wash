/**
 * API endpoint for processing expired assignments
 * POST /api/bookings/process-expired
 * This should be called by a cron job or scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobAssignmentService } from '@/lib/booking/assignment-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (cron job, internal service)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignmentService = new JobAssignmentService()
    await assignmentService.handleExpiredAssignments()

    return NextResponse.json({
      success: true,
      message: 'Expired assignments processed successfully'
    })
  } catch (error) {
    console.error('Error processing expired assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
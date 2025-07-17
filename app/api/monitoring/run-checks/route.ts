import { NextRequest, NextResponse } from 'next/server'
import { runScheduledMonitoringJob } from '@/lib/monitoring/scheduled-monitoring'

/**
 * API endpoint for running scheduled monitoring checks
 * Can be called by cron jobs or external schedulers
 * 
 * Usage:
 * POST /api/monitoring/run-checks
 * 
 * Optional headers:
 * - Authorization: Bearer <token> (for security)
 * - X-Monitoring-Job: <job_type> (specific job to run)
 */
export async function POST(request: NextRequest) {
  try {
    // Basic security check (optional)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.MONITORING_API_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[MONITORING_API] Running scheduled monitoring job...')
    
    // Run the monitoring job
    const result = await runScheduledMonitoringJob()
    
    console.log('[MONITORING_API] Monitoring job completed:', {
      success: result.success,
      duration: result.duration_ms,
      errors: result.errors?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Monitoring job completed successfully'
    })

  } catch (error) {
    console.error('[MONITORING_API] Error running monitoring job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to run monitoring job'
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Monitoring API is running',
    timestamp: new Date().toISOString()
  })
}
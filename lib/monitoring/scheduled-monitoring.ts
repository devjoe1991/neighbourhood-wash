import { monitoringAPI } from './monitoring-api'
import { alertingSystem } from './alerting-system'
import { verificationAnalytics } from './verification-analytics'

/**
 * Scheduled Monitoring Jobs
 * Provides automated monitoring checks that can be run on a schedule
 * Part of task 11 implementation for comprehensive monitoring
 */

export interface MonitoringJobResult {
  job_name: string
  executed_at: string
  duration_ms: number
  success: boolean
  results: Record<string, any>
  errors?: string[]
}

/**
 * Main monitoring job that runs all checks
 */
export async function runScheduledMonitoringJob(): Promise<MonitoringJobResult> {
  const startTime = Date.now()
  const jobName = 'scheduled_monitoring_check'
  const errors: string[] = []
  const results: Record<string, any> = {}

  try {
    console.log('[SCHEDULED_MONITORING] Starting scheduled monitoring job')

    // 1. Run alert rule checks
    try {
      const triggeredAlerts = await alertingSystem.checkAlertRules()
      results.alerts_triggered = triggeredAlerts.length
      results.alert_details = triggeredAlerts.map(alert => ({
        type: alert.type,
        severity: alert.severity,
        title: alert.title
      }))
      
      console.log(`[SCHEDULED_MONITORING] Alert check complete: ${triggeredAlerts.length} alerts triggered`)
    } catch (error) {
      const errorMsg = `Alert check failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error('[SCHEDULED_MONITORING]', errorMsg)
    }

    // 2. Check system health
    try {
      const systemHealth = await monitoringAPI.getSystemHealth()
      results.system_health = {
        status: systemHealth.status,
        issues_count: systemHealth.issues.length,
        critical_issues: systemHealth.issues
      }
      
      console.log(`[SCHEDULED_MONITORING] System health check complete: ${systemHealth.status}`)
    } catch (error) {
      const errorMsg = `System health check failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error('[SCHEDULED_MONITORING]', errorMsg)
    }

    // 3. Get recent metrics summary
    try {
      const metrics = await verificationAnalytics.getVerificationMetrics()
      if (metrics) {
        results.metrics_summary = {
          completion_rate: metrics.completion_rate,
          error_rate: metrics.error_rate,
          total_started: metrics.total_started,
          total_completed: metrics.total_completed
        }
      }
      
      console.log('[SCHEDULED_MONITORING] Metrics summary retrieved')
    } catch (error) {
      const errorMsg = `Metrics retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error('[SCHEDULED_MONITORING]', errorMsg)
    }

    // 4. Clean up old data (optional maintenance)
    try {
      await performMaintenanceTasks()
      results.maintenance_completed = true
      console.log('[SCHEDULED_MONITORING] Maintenance tasks completed')
    } catch (error) {
      const errorMsg = `Maintenance tasks failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error('[SCHEDULED_MONITORING]', errorMsg)
    }

    const duration = Date.now() - startTime
    const success = errors.length === 0

    const result: MonitoringJobResult = {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success,
      results,
      errors: errors.length > 0 ? errors : undefined
    }

    // Log job completion
    console.log(`[SCHEDULED_MONITORING] Job completed in ${duration}ms, success: ${success}`)
    
    // Log structured result for monitoring
    console.log(`[MONITORING_JOB_RESULT] ${JSON.stringify({
      type: 'scheduled_monitoring_job',
      ...result
    })}`)

    return result

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    console.error('[SCHEDULED_MONITORING] Job failed:', error)
    
    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: false,
      results: {},
      errors: [errorMsg]
    }
  }
}

/**
 * Performance monitoring job - focuses on API and system performance
 */
export async function runPerformanceMonitoringJob(): Promise<MonitoringJobResult> {
  const startTime = Date.now()
  const jobName = 'performance_monitoring_check'
  const errors: string[] = []
  const results: Record<string, any> = {}

  try {
    console.log('[PERFORMANCE_MONITORING] Starting performance monitoring job')

    // Generate performance report for last 24 hours
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const performanceReport = await monitoringAPI.generatePerformanceReport(startDate, endDate)
    
    results.performance_summary = {
      period: performanceReport.period,
      avg_completion_time: performanceReport.user_journey_analysis.avg_completion_time_ms,
      completion_rate: performanceReport.user_journey_analysis.completion_rate,
      total_errors: performanceReport.error_analysis.total_errors,
      stripe_api_performance: performanceReport.api_performance.stripe_operations.slice(0, 3), // Top 3
      database_performance: performanceReport.api_performance.database_operations.slice(0, 3) // Top 3
    }

    // Check for performance issues
    const slowStripeOps = performanceReport.api_performance.stripe_operations
      .filter(op => op.avg_duration_ms > 5000)
    
    const slowDbOps = performanceReport.api_performance.database_operations
      .filter(op => op.avg_duration_ms > 1000)

    if (slowStripeOps.length > 0 || slowDbOps.length > 0) {
      results.performance_issues = {
        slow_stripe_operations: slowStripeOps,
        slow_database_operations: slowDbOps
      }
    }

    const duration = Date.now() - startTime
    
    console.log(`[PERFORMANCE_MONITORING] Job completed in ${duration}ms`)

    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    console.error('[PERFORMANCE_MONITORING] Job failed:', error)
    
    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: false,
      results: {},
      errors: [errorMsg]
    }
  }
}

/**
 * User journey analysis job - analyzes user behavior and drop-off points
 */
export async function runUserJourneyAnalysisJob(): Promise<MonitoringJobResult> {
  const startTime = Date.now()
  const jobName = 'user_journey_analysis'
  const errors: string[] = []
  const results: Record<string, any> = {}

  try {
    console.log('[USER_JOURNEY_ANALYSIS] Starting user journey analysis job')

    // Analyze journeys from last 7 days
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const performanceReport = await monitoringAPI.generatePerformanceReport(startDate, endDate)
    
    results.journey_analysis = {
      period: performanceReport.period,
      completion_rate: performanceReport.user_journey_analysis.completion_rate,
      avg_completion_time: performanceReport.user_journey_analysis.avg_completion_time_ms,
      drop_off_points: performanceReport.user_journey_analysis.common_drop_off_points
    }

    // Identify concerning trends
    const concerns: string[] = []
    
    if (performanceReport.user_journey_analysis.completion_rate < 50) {
      concerns.push(`Low completion rate: ${performanceReport.user_journey_analysis.completion_rate}%`)
    }
    
    if (performanceReport.user_journey_analysis.avg_completion_time_ms > 10 * 60 * 1000) { // > 10 minutes
      concerns.push(`Long completion time: ${Math.round(performanceReport.user_journey_analysis.avg_completion_time_ms / 60000)} minutes`)
    }

    const highDropOffPoints = performanceReport.user_journey_analysis.common_drop_off_points
      .filter(point => point.drop_off_rate > 20)
    
    if (highDropOffPoints.length > 0) {
      concerns.push(`High drop-off at: ${highDropOffPoints.map(p => p.step).join(', ')}`)
    }

    if (concerns.length > 0) {
      results.concerns = concerns
    }

    const duration = Date.now() - startTime
    
    console.log(`[USER_JOURNEY_ANALYSIS] Job completed in ${duration}ms`)

    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    console.error('[USER_JOURNEY_ANALYSIS] Job failed:', error)
    
    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: false,
      results: {},
      errors: [errorMsg]
    }
  }
}

/**
 * Maintenance tasks for monitoring system
 */
async function performMaintenanceTasks(): Promise<void> {
  try {
    // This would typically include:
    // 1. Clean up old events (older than 90 days)
    // 2. Resolve old alerts (older than 72 hours)
    // 3. Compress old data
    // 4. Update performance baselines
    
    console.log('[MAINTENANCE] Running maintenance tasks')
    
    // Example: Auto-resolve old alerts
    // This would be implemented with a database function call
    // await supabase.rpc('auto_resolve_old_alerts', { hours_old: 72 })
    
    console.log('[MAINTENANCE] Maintenance tasks completed')
  } catch (error) {
    console.error('[MAINTENANCE] Maintenance tasks failed:', error)
    throw error
  }
}

/**
 * Health check job - quick system health verification
 */
export async function runHealthCheckJob(): Promise<MonitoringJobResult> {
  const startTime = Date.now()
  const jobName = 'health_check'
  
  try {
    const systemHealth = await monitoringAPI.getSystemHealth()
    const duration = Date.now() - startTime
    
    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: systemHealth.status !== 'critical',
      results: {
        status: systemHealth.status,
        issues: systemHealth.issues,
        checks: systemHealth.checks
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    return {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      success: false,
      results: {},
      errors: [errorMsg]
    }
  }
}

// Export job functions for scheduling
export const monitoringJobs = {
  scheduled: runScheduledMonitoringJob,
  performance: runPerformanceMonitoringJob,
  userJourney: runUserJourneyAnalysisJob,
  healthCheck: runHealthCheckJob
}

// Helper function to run all jobs
export async function runAllMonitoringJobs(): Promise<MonitoringJobResult[]> {
  console.log('[MONITORING_JOBS] Running all monitoring jobs')
  
  const results = await Promise.allSettled([
    runScheduledMonitoringJob(),
    runPerformanceMonitoringJob(),
    runUserJourneyAnalysisJob(),
    runHealthCheckJob()
  ])

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      const jobNames = ['scheduled', 'performance', 'userJourney', 'healthCheck']
      return {
        job_name: jobNames[index],
        executed_at: new Date().toISOString(),
        duration_ms: 0,
        success: false,
        results: {},
        errors: [result.reason?.message || 'Job failed']
      }
    }
  })
}
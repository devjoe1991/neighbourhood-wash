'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Onboarding Analytics Aggregation Functions
 * Requirements: 9.1, 9.3, 9.4 - Analytics for completion rates
 */

export interface OnboardingMetrics {
  date: string
  hour?: number
  totalStarted: number
  step1Completed: number
  step2Completed: number
  step3Completed: number
  step4Completed: number
  totalCompleted: number
  step1CompletionRate: number
  step2CompletionRate: number
  step3CompletionRate: number
  step4CompletionRate: number
  overallCompletionRate: number
  avgStep1TimeMinutes?: number
  avgStep2TimeMinutes?: number
  avgStep3TimeMinutes?: number
  avgStep4TimeMinutes?: number
  avgTotalTimeMinutes?: number
  totalErrors: number
  step1Errors: number
  step2Errors: number
  step3Errors: number
  step4Errors: number
}

/**
 * Aggregate onboarding data for a specific date
 * This function should be called daily to update analytics
 */
export async function aggregateOnboardingData(date: string, hour?: number): Promise<{
  success: boolean
  data?: OnboardingMetrics
  error?: string
}> {
  try {
    console.log(`[ANALYTICS] Aggregating onboarding data for ${date}${hour !== undefined ? ` hour ${hour}` : ''}`)

    const supabase = createSupabaseServerClient()

    // Define time range
    let startTime: string
    let endTime: string

    if (hour !== undefined) {
      // Hourly aggregation
      startTime = `${date} ${hour.toString().padStart(2, '0')}:00:00`
      endTime = `${date} ${hour.toString().padStart(2, '0')}:59:59`
    } else {
      // Daily aggregation
      startTime = `${date} 00:00:00`
      endTime = `${date} 23:59:59`
    }

    // Get all onboarding progress records for the time period
    const { data: progressRecords, error: progressError } = await supabase
      .from('onboarding_progress')
      .select('*')
      .gte('started_at', startTime)
      .lte('started_at', endTime)

    if (progressError) {
      console.error('[ANALYTICS] Error fetching progress records:', progressError)
      return {
        success: false,
        error: 'Failed to fetch onboarding progress data',
      }
    }

    // Get error logs for the time period
    const { data: errorLogs, error: errorLogsError } = await supabase
      .from('onboarding_step_logs')
      .select('step_number, status')
      .eq('status', 'error')
      .gte('created_at', startTime)
      .lte('created_at', endTime)

    if (errorLogsError) {
      console.warn('[ANALYTICS] Error fetching error logs:', errorLogsError)
    }

    // Calculate metrics
    const totalStarted = progressRecords.length
    const step1Completed = progressRecords.filter(r => r.completed_steps.includes(1)).length
    const step2Completed = progressRecords.filter(r => r.completed_steps.includes(2)).length
    const step3Completed = progressRecords.filter(r => r.completed_steps.includes(3)).length
    const step4Completed = progressRecords.filter(r => r.completed_steps.includes(4)).length
    const totalCompleted = progressRecords.filter(r => r.is_complete).length

    // Calculate completion rates
    const step1CompletionRate = totalStarted > 0 ? (step1Completed / totalStarted) * 100 : 0
    const step2CompletionRate = totalStarted > 0 ? (step2Completed / totalStarted) * 100 : 0
    const step3CompletionRate = totalStarted > 0 ? (step3Completed / totalStarted) * 100 : 0
    const step4CompletionRate = totalStarted > 0 ? (step4Completed / totalStarted) * 100 : 0
    const overallCompletionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0

    // Calculate average completion times
    const calculateAvgTime = (records: any[], stepNum: number): number | undefined => {
      const completedRecords = records.filter(r => 
        r.completed_steps.includes(stepNum) && 
        r[`step_${stepNum}_completed_at`] && 
        r.started_at
      )
      
      if (completedRecords.length === 0) return undefined

      const totalTime = completedRecords.reduce((sum, record) => {
        const startTime = new Date(record.started_at).getTime()
        const endTime = new Date(record[`step_${stepNum}_completed_at`]).getTime()
        return sum + (endTime - startTime)
      }, 0)

      return Math.round(totalTime / completedRecords.length / (1000 * 60)) // Convert to minutes
    }

    const avgStep1TimeMinutes = calculateAvgTime(progressRecords, 1)
    const avgStep2TimeMinutes = calculateAvgTime(progressRecords, 2)
    const avgStep3TimeMinutes = calculateAvgTime(progressRecords, 3)
    const avgStep4TimeMinutes = calculateAvgTime(progressRecords, 4)

    // Calculate total completion time
    const completedRecords = progressRecords.filter(r => r.is_complete && r.started_at && r.completed_at)
    const avgTotalTimeMinutes = completedRecords.length > 0
      ? Math.round(completedRecords.reduce((sum, record) => {
          const startTime = new Date(record.started_at).getTime()
          const endTime = new Date(record.completed_at).getTime()
          return sum + (endTime - startTime)
        }, 0) / completedRecords.length / (1000 * 60))
      : undefined

    // Calculate error counts
    const totalErrors = errorLogs?.length || 0
    const step1Errors = errorLogs?.filter(log => log.step_number === 1).length || 0
    const step2Errors = errorLogs?.filter(log => log.step_number === 2).length || 0
    const step3Errors = errorLogs?.filter(log => log.step_number === 3).length || 0
    const step4Errors = errorLogs?.filter(log => log.step_number === 4).length || 0

    const metrics: OnboardingMetrics = {
      date,
      hour,
      totalStarted,
      step1Completed,
      step2Completed,
      step3Completed,
      step4Completed,
      totalCompleted,
      step1CompletionRate: Math.round(step1CompletionRate * 100) / 100,
      step2CompletionRate: Math.round(step2CompletionRate * 100) / 100,
      step3CompletionRate: Math.round(step3CompletionRate * 100) / 100,
      step4CompletionRate: Math.round(step4CompletionRate * 100) / 100,
      overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
      avgStep1TimeMinutes,
      avgStep2TimeMinutes,
      avgStep3TimeMinutes,
      avgStep4TimeMinutes,
      avgTotalTimeMinutes,
      totalErrors,
      step1Errors,
      step2Errors,
      step3Errors,
      step4Errors,
    }

    // Save metrics to database
    const { error: upsertError } = await supabase
      .from('onboarding_analytics')
      .upsert({
        date,
        hour,
        total_started: totalStarted,
        step_1_completed: step1Completed,
        step_2_completed: step2Completed,
        step_3_completed: step3Completed,
        step_4_completed: step4Completed,
        total_completed: totalCompleted,
        step_1_completion_rate: step1CompletionRate,
        step_2_completion_rate: step2CompletionRate,
        step_3_completion_rate: step3CompletionRate,
        step_4_completion_rate: step4CompletionRate,
        overall_completion_rate: overallCompletionRate,
        avg_step_1_time_minutes: avgStep1TimeMinutes,
        avg_step_2_time_minutes: avgStep2TimeMinutes,
        avg_step_3_time_minutes: avgStep3TimeMinutes,
        avg_step_4_time_minutes: avgStep4TimeMinutes,
        avg_total_time_minutes: avgTotalTimeMinutes,
        total_errors: totalErrors,
        step_1_errors: step1Errors,
        step_2_errors: step2Errors,
        step_3_errors: step3Errors,
        step_4_errors: step4Errors,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('[ANALYTICS] Error saving metrics:', upsertError)
      return {
        success: false,
        error: 'Failed to save analytics data',
      }
    }

    console.log(`[ANALYTICS] ✅ Aggregated data for ${date}${hour !== undefined ? ` hour ${hour}` : ''}:`, {
      totalStarted,
      totalCompleted,
      overallCompletionRate: `${overallCompletionRate.toFixed(1)}%`
    })

    return {
      success: true,
      data: metrics,
    }
  } catch (error) {
    console.error('[ANALYTICS] Error aggregating onboarding data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Aggregate data for the last N days
 * Useful for backfilling analytics data
 */
export async function aggregateLastNDays(days: number = 7): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  const errors: string[] = []
  let processed = 0

  try {
    console.log(`[ANALYTICS] Aggregating data for last ${days} days`)

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      const result = await aggregateOnboardingData(dateString)
      if (result.success) {
        processed++
      } else {
        errors.push(`${dateString}: ${result.error}`)
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[ANALYTICS] ✅ Processed ${processed}/${days} days, ${errors.length} errors`)

    return {
      success: errors.length === 0,
      processed,
      errors,
    }
  } catch (error) {
    console.error('[ANALYTICS] Error in batch aggregation:', error)
    return {
      success: false,
      processed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Get onboarding funnel analysis
 * Shows drop-off rates between steps
 */
export async function getOnboardingFunnelAnalysis(startDate?: string, endDate?: string): Promise<{
  success: boolean
  data?: {
    totalStarted: number
    step1Completed: number
    step2Completed: number
    step3Completed: number
    step4Completed: number
    dropOffRates: {
      step1ToStep2: number
      step2ToStep3: number
      step3ToStep4: number
      overallDropOff: number
    }
    conversionRates: {
      startToStep1: number
      startToStep2: number
      startToStep3: number
      startToStep4: number
    }
  }
  error?: string
}> {
  try {
    console.log(`[FUNNEL_ANALYSIS] Analyzing funnel from ${startDate || 'beginning'} to ${endDate || 'now'}`)

    const supabase = createSupabaseServerClient()

    let query = supabase
      .from('onboarding_progress')
      .select('completed_steps, is_complete')

    if (startDate) {
      query = query.gte('started_at', startDate)
    }

    if (endDate) {
      query = query.lte('started_at', endDate)
    }

    const { data: progressRecords, error } = await query

    if (error) {
      console.error('[FUNNEL_ANALYSIS] Error fetching data:', error)
      return {
        success: false,
        error: 'Failed to fetch onboarding data',
      }
    }

    const totalStarted = progressRecords.length
    const step1Completed = progressRecords.filter(r => r.completed_steps.includes(1)).length
    const step2Completed = progressRecords.filter(r => r.completed_steps.includes(2)).length
    const step3Completed = progressRecords.filter(r => r.completed_steps.includes(3)).length
    const step4Completed = progressRecords.filter(r => r.completed_steps.includes(4)).length

    // Calculate drop-off rates
    const step1ToStep2 = step1Completed > 0 ? ((step1Completed - step2Completed) / step1Completed) * 100 : 0
    const step2ToStep3 = step2Completed > 0 ? ((step2Completed - step3Completed) / step2Completed) * 100 : 0
    const step3ToStep4 = step3Completed > 0 ? ((step3Completed - step4Completed) / step3Completed) * 100 : 0
    const overallDropOff = totalStarted > 0 ? ((totalStarted - step4Completed) / totalStarted) * 100 : 0

    // Calculate conversion rates
    const startToStep1 = totalStarted > 0 ? (step1Completed / totalStarted) * 100 : 0
    const startToStep2 = totalStarted > 0 ? (step2Completed / totalStarted) * 100 : 0
    const startToStep3 = totalStarted > 0 ? (step3Completed / totalStarted) * 100 : 0
    const startToStep4 = totalStarted > 0 ? (step4Completed / totalStarted) * 100 : 0

    const analysis = {
      totalStarted,
      step1Completed,
      step2Completed,
      step3Completed,
      step4Completed,
      dropOffRates: {
        step1ToStep2: Math.round(step1ToStep2 * 100) / 100,
        step2ToStep3: Math.round(step2ToStep3 * 100) / 100,
        step3ToStep4: Math.round(step3ToStep4 * 100) / 100,
        overallDropOff: Math.round(overallDropOff * 100) / 100,
      },
      conversionRates: {
        startToStep1: Math.round(startToStep1 * 100) / 100,
        startToStep2: Math.round(startToStep2 * 100) / 100,
        startToStep3: Math.round(startToStep3 * 100) / 100,
        startToStep4: Math.round(startToStep4 * 100) / 100,
      },
    }

    console.log(`[FUNNEL_ANALYSIS] ✅ Analysis complete:`, {
      totalStarted,
      overallConversion: `${startToStep4.toFixed(1)}%`,
      biggestDropOff: Math.max(step1ToStep2, step2ToStep3, step3ToStep4)
    })

    return {
      success: true,
      data: analysis,
    }
  } catch (error) {
    console.error('[FUNNEL_ANALYSIS] Error analyzing funnel:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get onboarding performance insights
 * Identifies bottlenecks and areas for improvement
 */
export async function getOnboardingInsights(): Promise<{
  success: boolean
  insights?: {
    bottleneckStep: number
    bottleneckStepName: string
    bottleneckDropOffRate: number
    averageCompletionTime: number
    mostCommonErrors: Array<{
      step: number
      stepName: string
      errorCount: number
    }>
    recommendations: string[]
  }
  error?: string
}> {
  try {
    console.log('[INSIGHTS] Generating onboarding insights')

    // Get funnel analysis
    const funnelResult = await getOnboardingFunnelAnalysis()
    if (!funnelResult.success || !funnelResult.data) {
      return {
        success: false,
        error: 'Failed to get funnel analysis for insights',
      }
    }

    const funnel = funnelResult.data

    // Identify bottleneck step (highest drop-off rate)
    const dropOffRates = [
      { step: 1, rate: 100 - funnel.conversionRates.startToStep1, name: 'Profile & Service Setup' },
      { step: 2, rate: funnel.dropOffRates.step1ToStep2, name: 'Stripe Connect KYC' },
      { step: 3, rate: funnel.dropOffRates.step2ToStep3, name: 'Bank Account Connection' },
      { step: 4, rate: funnel.dropOffRates.step3ToStep4, name: 'Onboarding Fee Payment' },
    ]

    const bottleneck = dropOffRates.reduce((max, current) => 
      current.rate > max.rate ? current : max
    )

    // Get error analysis
    const supabase = createSupabaseServerClient()
    const { data: errorLogs } = await supabase
      .from('onboarding_step_logs')
      .select('step_number, step_name')
      .eq('status', 'error')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    const errorCounts = errorLogs?.reduce((acc, log) => {
      const key = `${log.step_number}-${log.step_name}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([key, count]) => {
        const [step, stepName] = key.split('-')
        return {
          step: parseInt(step),
          stepName,
          errorCount: count,
        }
      })
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 3)

    // Calculate average completion time
    const { data: completedRecords } = await supabase
      .from('onboarding_progress')
      .select('started_at, completed_at')
      .eq('is_complete', true)
      .not('started_at', 'is', null)
      .not('completed_at', 'is', null)

    const averageCompletionTime = completedRecords && completedRecords.length > 0
      ? completedRecords.reduce((sum, record) => {
          const start = new Date(record.started_at).getTime()
          const end = new Date(record.completed_at).getTime()
          return sum + (end - start)
        }, 0) / completedRecords.length / (1000 * 60) // Convert to minutes
      : 0

    // Generate recommendations
    const recommendations: string[] = []

    if (bottleneck.rate > 50) {
      recommendations.push(`High drop-off at ${bottleneck.name} (${bottleneck.rate.toFixed(1)}%). Consider simplifying this step or adding more guidance.`)
    }

    if (averageCompletionTime > 60) {
      recommendations.push(`Average completion time is ${Math.round(averageCompletionTime)} minutes. Consider streamlining the process.`)
    }

    if (mostCommonErrors.length > 0) {
      recommendations.push(`Most errors occur in ${mostCommonErrors[0].stepName}. Review error handling and user guidance for this step.`)
    }

    if (funnel.conversionRates.startToStep4 < 70) {
      recommendations.push(`Overall completion rate is ${funnel.conversionRates.startToStep4.toFixed(1)}%. Consider A/B testing different onboarding flows.`)
    }

    const insights = {
      bottleneckStep: bottleneck.step,
      bottleneckStepName: bottleneck.name,
      bottleneckDropOffRate: bottleneck.rate,
      averageCompletionTime: Math.round(averageCompletionTime),
      mostCommonErrors,
      recommendations,
    }

    console.log('[INSIGHTS] ✅ Generated insights:', {
      bottleneck: `Step ${bottleneck.step} (${bottleneck.rate.toFixed(1)}% drop-off)`,
      avgTime: `${Math.round(averageCompletionTime)}min`,
      recommendations: recommendations.length
    })

    return {
      success: true,
      insights,
    }
  } catch (error) {
    console.error('[INSIGHTS] Error generating insights:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
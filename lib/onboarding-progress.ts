'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Onboarding Progress Tracking and Status Management
 * Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
 */

export interface OnboardingProgressData {
  currentStep: number
  completedSteps: number[]
  isComplete: boolean
  startedAt?: string
  completedAt?: string
  lastActivityAt?: string
  stepCompletionTimes: {
    step1?: string
    step2?: string
    step3?: string
    step4?: string
  }
  stepData: {
    profileSetup?: any
    stripeKyc?: any
    bankConnection?: any
    payment?: any
  }
  retryCount: number
  lastError?: any
}

export interface OnboardingStepLog {
  id: string
  userId: string
  stepNumber: number
  stepName: string
  action: string
  status: string
  data?: any
  errorDetails?: any
  sessionId?: string
  createdAt: string
}

export interface OnboardingAnalytics {
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

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: {
    type: string
    message: string
    details?: any
  }
}

/**
 * Get comprehensive onboarding progress for a user
 * Requirements: 8.1 - Display current step progress
 */
export async function getOnboardingProgress(userId: string): Promise<ServiceResponse<OnboardingProgressData>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_PROGRESS] Getting progress for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Call the database function to get progress
    const { data, error } = await supabase.rpc('get_onboarding_progress', {
      p_user_id: userId
    })

    if (error) {
      console.error('[ONBOARDING_PROGRESS] Database error:', error)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to retrieve onboarding progress',
          details: error,
        },
      }
    }

    const progressData: OnboardingProgressData = {
      currentStep: data.currentStep || 1,
      completedSteps: data.completedSteps || [],
      isComplete: data.isComplete || false,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      lastActivityAt: data.lastActivityAt,
      stepCompletionTimes: data.stepCompletionTimes || {},
      stepData: data.stepData || {},
      retryCount: data.retryCount || 0,
      lastError: data.lastError,
    }

    console.log(`[ONBOARDING_PROGRESS] Retrieved progress:`, progressData)

    return {
      success: true,
      data: progressData,
    }
  } catch (error) {
    console.error('[ONBOARDING_PROGRESS] Error getting progress:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while retrieving onboarding progress',
        details: error,
      },
    }
  }
}

/**
 * Update onboarding progress when a step is completed
 * Requirements: 8.2 - Status updates for each completed step
 */
export async function updateOnboardingProgress(
  userId: string,
  stepNumber: number,
  stepData?: any,
  sessionId?: string
): Promise<ServiceResponse<OnboardingProgressData>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    if (!stepNumber || stepNumber < 1 || stepNumber > 4) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Step number must be between 1 and 4',
        },
      }
    }

    console.log(`[ONBOARDING_PROGRESS] Updating step ${stepNumber} for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Call the database function to update progress
    const { data, error } = await supabase.rpc('update_onboarding_progress', {
      p_user_id: userId,
      p_step_number: stepNumber,
      p_step_data: stepData ? JSON.stringify(stepData) : null,
      p_session_id: sessionId
    })

    if (error) {
      console.error('[ONBOARDING_PROGRESS] Database error:', error)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to update onboarding progress',
          details: error,
        },
      }
    }

    if (!data.success) {
      return {
        success: false,
        error: {
          type: 'update_error',
          message: data.error || 'Failed to update progress',
        },
      }
    }

    console.log(`[ONBOARDING_PROGRESS] Updated successfully:`, data)

    // Get the updated progress data
    const progressResult = await getOnboardingProgress(userId)
    
    // Revalidate relevant paths
    revalidatePath('/washer/dashboard')
    revalidatePath('/admin/washers')

    return progressResult
  } catch (error) {
    console.error('[ONBOARDING_PROGRESS] Error updating progress:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while updating onboarding progress',
        details: error,
      },
    }
  }
}

/**
 * Log an onboarding step action for audit trail
 * Requirements: 9.2 - Log changes for audit purposes
 */
export async function logOnboardingStep(
  userId: string,
  stepNumber: number,
  action: string,
  status: string = 'success',
  data?: any,
  errorDetails?: any,
  sessionId?: string
): Promise<ServiceResponse<void>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_LOG] Logging ${action} for step ${stepNumber}, user: ${userId}`)

    const supabase = createSupabaseServerClient()

    // Call the database function to log the step
    const { error } = await supabase.rpc('log_onboarding_step', {
      p_user_id: userId,
      p_step_number: stepNumber,
      p_action: action,
      p_status: status,
      p_data: data ? JSON.stringify(data) : null,
      p_error_details: errorDetails ? JSON.stringify(errorDetails) : null,
      p_session_id: sessionId
    })

    if (error) {
      console.error('[ONBOARDING_LOG] Database error:', error)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to log onboarding step',
          details: error,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[ONBOARDING_LOG] Error logging step:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while logging onboarding step',
        details: error,
      },
    }
  }
}

/**
 * Get onboarding step logs for a user
 * Requirements: 9.2 - Audit trail access
 */
export async function getOnboardingStepLogs(
  userId: string,
  limit: number = 50
): Promise<ServiceResponse<OnboardingStepLog[]>> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Valid user ID is required',
        },
      }
    }

    console.log(`[ONBOARDING_LOGS] Getting logs for user: ${userId}`)

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('onboarding_step_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[ONBOARDING_LOGS] Database error:', error)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to retrieve onboarding logs',
          details: error,
        },
      }
    }

    const logs: OnboardingStepLog[] = data.map(log => ({
      id: log.id,
      userId: log.user_id,
      stepNumber: log.step_number,
      stepName: log.step_name,
      action: log.action,
      status: log.status,
      data: log.data,
      errorDetails: log.error_details,
      sessionId: log.session_id,
      createdAt: log.created_at,
    }))

    return {
      success: true,
      data: logs,
    }
  } catch (error) {
    console.error('[ONBOARDING_LOGS] Error getting logs:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while retrieving onboarding logs',
        details: error,
      },
    }
  }
}

/**
 * Get onboarding analytics for admin dashboard
 * Requirements: 9.1, 9.3, 9.4 - Analytics for completion rates
 */
export async function getOnboardingAnalytics(
  startDate?: string,
  endDate?: string,
  includeHourly: boolean = false
): Promise<ServiceResponse<OnboardingAnalytics[]>> {
  try {
    console.log(`[ONBOARDING_ANALYTICS] Getting analytics from ${startDate} to ${endDate}`)

    const supabase = createSupabaseServerClient()

    let query = supabase
      .from('onboarding_analytics')
      .select('*')
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (!includeHourly) {
      query = query.is('hour', null)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('[ONBOARDING_ANALYTICS] Database error:', error)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to retrieve onboarding analytics',
          details: error,
        },
      }
    }

    const analytics: OnboardingAnalytics[] = data.map(record => ({
      date: record.date,
      hour: record.hour,
      totalStarted: record.total_started || 0,
      step1Completed: record.step_1_completed || 0,
      step2Completed: record.step_2_completed || 0,
      step3Completed: record.step_3_completed || 0,
      step4Completed: record.step_4_completed || 0,
      totalCompleted: record.total_completed || 0,
      step1CompletionRate: parseFloat(record.step_1_completion_rate || '0'),
      step2CompletionRate: parseFloat(record.step_2_completion_rate || '0'),
      step3CompletionRate: parseFloat(record.step_3_completion_rate || '0'),
      step4CompletionRate: parseFloat(record.step_4_completion_rate || '0'),
      overallCompletionRate: parseFloat(record.overall_completion_rate || '0'),
      avgStep1TimeMinutes: record.avg_step_1_time_minutes,
      avgStep2TimeMinutes: record.avg_step_2_time_minutes,
      avgStep3TimeMinutes: record.avg_step_3_time_minutes,
      avgStep4TimeMinutes: record.avg_step_4_time_minutes,
      avgTotalTimeMinutes: record.avg_total_time_minutes,
      totalErrors: record.total_errors || 0,
      step1Errors: record.step_1_errors || 0,
      step2Errors: record.step_2_errors || 0,
      step3Errors: record.step_3_errors || 0,
      step4Errors: record.step_4_errors || 0,
    }))

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error('[ONBOARDING_ANALYTICS] Error getting analytics:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while retrieving onboarding analytics',
        details: error,
      },
    }
  }
}

/**
 * Initialize onboarding progress for a new washer
 * Requirements: 8.3 - Progress persistence and recovery mechanisms
 */
export async function initializeOnboardingProgress(
  userId: string,
  sessionId?: string
): Promise<ServiceResponse<OnboardingProgressData>> {
  try {
    console.log(`[ONBOARDING_INIT] Initializing progress for user: ${userId}`)

    // Log the start of onboarding
    await logOnboardingStep(
      userId,
      1,
      'started',
      'success',
      { initialized: true },
      null,
      sessionId
    )

    // Get the current progress (this will create a default record if none exists)
    return await getOnboardingProgress(userId)
  } catch (error) {
    console.error('[ONBOARDING_INIT] Error initializing progress:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while initializing onboarding progress',
        details: error,
      },
    }
  }
}

/**
 * Reset onboarding progress for a user (admin function)
 * Requirements: 8.3 - Progress recovery mechanisms
 */
export async function resetOnboardingProgress(
  userId: string,
  adminUserId: string,
  reason?: string
): Promise<ServiceResponse<void>> {
  try {
    console.log(`[ONBOARDING_RESET] Resetting progress for user: ${userId} by admin: ${adminUserId}`)

    const supabase = createSupabaseServerClient()

    // Verify admin permissions
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUserId)
      .single()

    if (adminError || !adminProfile || adminProfile.role !== 'admin') {
      return {
        success: false,
        error: {
          type: 'permission_error',
          message: 'Only administrators can reset onboarding progress',
        },
      }
    }

    // Delete existing progress record
    const { error: deleteError } = await supabase
      .from('onboarding_progress')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[ONBOARDING_RESET] Error deleting progress:', deleteError)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to reset onboarding progress',
          details: deleteError,
        },
      }
    }

    // Log the reset action
    await logOnboardingStep(
      userId,
      1,
      'reset',
      'success',
      { 
        resetBy: adminUserId,
        reason: reason || 'Admin reset',
        resetAt: new Date().toISOString()
      }
    )

    console.log(`[ONBOARDING_RESET] Successfully reset progress for user: ${userId}`)

    // Revalidate relevant paths
    revalidatePath('/washer/dashboard')
    revalidatePath('/admin/washers')

    return {
      success: true,
    }
  } catch (error) {
    console.error('[ONBOARDING_RESET] Error resetting progress:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while resetting onboarding progress',
        details: error,
      },
    }
  }
}

/**
 * Get onboarding completion statistics
 * Requirements: 9.1, 9.3, 9.4 - Monitor completion rates
 */
export async function getOnboardingStats(): Promise<ServiceResponse<{
  totalWashers: number
  completedOnboarding: number
  inProgress: number
  completionRate: number
  averageCompletionTime: number
  stepBreakdown: {
    step1: number
    step2: number
    step3: number
    step4: number
  }
  recentActivity: {
    last24Hours: number
    last7Days: number
    last30Days: number
  }
}>> {
  try {
    console.log('[ONBOARDING_STATS] Getting completion statistics')

    const supabase = createSupabaseServerClient()

    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from('onboarding_progress')
      .select('current_step, completed_steps, is_complete, started_at, completed_at')

    if (statsError) {
      console.error('[ONBOARDING_STATS] Error getting stats:', statsError)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: 'Failed to retrieve onboarding statistics',
          details: statsError,
        },
      }
    }

    const totalWashers = stats.length
    const completedOnboarding = stats.filter(s => s.is_complete).length
    const inProgress = totalWashers - completedOnboarding
    const completionRate = totalWashers > 0 ? (completedOnboarding / totalWashers) * 100 : 0

    // Calculate average completion time
    const completedWithTimes = stats.filter(s => s.is_complete && s.started_at && s.completed_at)
    const averageCompletionTime = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, s) => {
          const start = new Date(s.started_at).getTime()
          const end = new Date(s.completed_at).getTime()
          return sum + (end - start)
        }, 0) / completedWithTimes.length / (1000 * 60) // Convert to minutes
      : 0

    // Step breakdown
    const stepBreakdown = {
      step1: stats.filter(s => s.completed_steps.includes(1)).length,
      step2: stats.filter(s => s.completed_steps.includes(2)).length,
      step3: stats.filter(s => s.completed_steps.includes(3)).length,
      step4: stats.filter(s => s.completed_steps.includes(4)).length,
    }

    // Recent activity
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentActivity = {
      last24Hours: stats.filter(s => new Date(s.started_at) >= last24Hours).length,
      last7Days: stats.filter(s => new Date(s.started_at) >= last7Days).length,
      last30Days: stats.filter(s => new Date(s.started_at) >= last30Days).length,
    }

    return {
      success: true,
      data: {
        totalWashers,
        completedOnboarding,
        inProgress,
        completionRate,
        averageCompletionTime,
        stepBreakdown,
        recentActivity,
      },
    }
  } catch (error) {
    console.error('[ONBOARDING_STATS] Error getting statistics:', error)
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred while retrieving onboarding statistics',
        details: error,
      },
    }
  }
}
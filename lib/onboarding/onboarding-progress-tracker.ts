'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { OnboardingStatus } from './onboarding-service'

export interface OnboardingProgressEntry {
  id: string
  userId: string
  step: OnboardingStatus
  status: 'started' | 'in_progress' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  duration?: number
  errorMessage?: string
  stepData?: any
  metadata?: any
}

export interface OnboardingAnalytics {
  totalUsers: number
  completionRate: number
  averageCompletionTime: number
  stepCompletionRates: Record<OnboardingStatus, number>
  commonFailurePoints: Array<{
    step: OnboardingStatus
    failureRate: number
    commonErrors: string[]
  }>
  dailyStarted: number
  dailyCompleted: number
}

/**
 * Track when a user starts an onboarding step
 */
export async function trackStepStarted(
  userId: string,
  step: OnboardingStatus,
  metadata?: any
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('onboarding_progress')
      .insert({
        user_id: userId,
        step,
        status: 'started',
        started_at: new Date().toISOString(),
        metadata,
      })
  } catch (error) {
    console.error('Error tracking step started:', error)
    // Don't fail the main operation for tracking errors
  }
}

/**
 * Track when a user is in progress on an onboarding step
 */
export async function trackStepInProgress(
  userId: string,
  step: OnboardingStatus,
  stepData?: any
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('onboarding_progress')
      .update({
        status: 'in_progress',
        step_data: stepData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('step', step)
      .eq('status', 'started')
  } catch (error) {
    console.error('Error tracking step in progress:', error)
  }
}

/**
 * Track when a user completes an onboarding step
 */
export async function trackStepCompleted(
  userId: string,
  step: OnboardingStatus,
  stepData?: any,
  metadata?: any
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    const completedAt = new Date().toISOString()
    
    // Get the started entry to calculate duration
    const { data: progressEntry } = await supabase
      .from('onboarding_progress')
      .select('started_at')
      .eq('user_id', userId)
      .eq('step', step)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    let duration: number | undefined
    if (progressEntry?.started_at) {
      const startTime = new Date(progressEntry.started_at).getTime()
      const endTime = new Date(completedAt).getTime()
      duration = Math.round((endTime - startTime) / 1000) // Duration in seconds
    }
    
    await supabase
      .from('onboarding_progress')
      .update({
        status: 'completed',
        completed_at: completedAt,
        duration,
        step_data: stepData,
        metadata,
        updated_at: completedAt,
      })
      .eq('user_id', userId)
      .eq('step', step)
      .in('status', ['started', 'in_progress'])
  } catch (error) {
    console.error('Error tracking step completed:', error)
  }
}

/**
 * Track when a user fails an onboarding step
 */
export async function trackStepFailed(
  userId: string,
  step: OnboardingStatus,
  errorMessage: string,
  stepData?: any,
  metadata?: any
): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    const failedAt = new Date().toISOString()
    
    // Get the started entry to calculate duration
    const { data: progressEntry } = await supabase
      .from('onboarding_progress')
      .select('started_at')
      .eq('user_id', userId)
      .eq('step', step)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    let duration: number | undefined
    if (progressEntry?.started_at) {
      const startTime = new Date(progressEntry.started_at).getTime()
      const endTime = new Date(failedAt).getTime()
      duration = Math.round((endTime - startTime) / 1000) // Duration in seconds
    }
    
    await supabase
      .from('onboarding_progress')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration,
        step_data: stepData,
        metadata,
        updated_at: failedAt,
      })
      .eq('user_id', userId)
      .eq('step', step)
      .in('status', ['started', 'in_progress'])
  } catch (error) {
    console.error('Error tracking step failed:', error)
  }
}

/**
 * Get onboarding progress for a specific user
 */
export async function getUserOnboardingProgress(userId: string): Promise<OnboardingProgressEntry[]> {
  const supabase = createSupabaseServerClient()
  
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching user onboarding progress:', error)
      return []
    }
    
    return data.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      step: entry.step as OnboardingStatus,
      status: entry.status as 'started' | 'in_progress' | 'completed' | 'failed',
      startedAt: entry.started_at,
      completedAt: entry.completed_at || undefined,
      duration: entry.duration || undefined,
      errorMessage: entry.error_message || undefined,
      stepData: entry.step_data,
      metadata: entry.metadata,
    }))
  } catch (error) {
    console.error('Error getting user onboarding progress:', error)
    return []
  }
}

/**
 * Get onboarding analytics for admin dashboard
 */
export async function getOnboardingAnalytics(
  startDate?: string,
  endDate?: string
): Promise<OnboardingAnalytics> {
  const supabase = createSupabaseServerClient()
  
  try {
    const dateFilter = startDate && endDate 
      ? `created_at >= '${startDate}' AND created_at <= '${endDate}'`
      : `created_at >= '${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}'` // Last 30 days
    
    // Get total users who started onboarding
    const { data: totalUsersData } = await supabase
      .from('onboarding_progress')
      .select('user_id')
      .eq('step', 'profile_setup')
      .eq('status', 'started')
      .filter('created_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const totalUsers = new Set(totalUsersData?.map(u => u.user_id) || []).size
    
    // Get completed users
    const { data: completedUsersData } = await supabase
      .from('washer_profiles')
      .select('user_id')
      .eq('onboarding_status', 'completed')
      .filter('onboarding_completed_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const completedUsers = completedUsersData?.length || 0
    const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0
    
    // Get average completion time
    const { data: completionTimes } = await supabase
      .from('washer_profiles')
      .select('onboarding_started_at, onboarding_completed_at')
      .eq('onboarding_status', 'completed')
      .not('onboarding_started_at', 'is', null)
      .not('onboarding_completed_at', 'is', null)
      .filter('onboarding_completed_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    let averageCompletionTime = 0
    if (completionTimes && completionTimes.length > 0) {
      const totalTime = completionTimes.reduce((sum, entry) => {
        const start = new Date(entry.onboarding_started_at!).getTime()
        const end = new Date(entry.onboarding_completed_at!).getTime()
        return sum + (end - start)
      }, 0)
      averageCompletionTime = Math.round(totalTime / completionTimes.length / (1000 * 60 * 60)) // Hours
    }
    
    // Get step completion rates
    const steps: OnboardingStatus[] = ['profile_setup', 'verification_pending', 'verification_complete', 'payment_setup']
    const stepCompletionRates: Record<OnboardingStatus, number> = {} as any
    
    for (const step of steps) {
      const { data: stepStarted } = await supabase
        .from('onboarding_progress')
        .select('user_id')
        .eq('step', step)
        .eq('status', 'started')
        .filter('created_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      const { data: stepCompleted } = await supabase
        .from('onboarding_progress')
        .select('user_id')
        .eq('step', step)
        .eq('status', 'completed')
        .filter('created_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      const started = new Set(stepStarted?.map(s => s.user_id) || []).size
      const completed = new Set(stepCompleted?.map(s => s.user_id) || []).size
      
      stepCompletionRates[step] = started > 0 ? (completed / started) * 100 : 0
    }
    
    // Get common failure points
    const commonFailurePoints = []
    for (const step of steps) {
      const { data: failures } = await supabase
        .from('onboarding_progress')
        .select('error_message')
        .eq('step', step)
        .eq('status', 'failed')
        .filter('created_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      const { data: attempts } = await supabase
        .from('onboarding_progress')
        .select('user_id')
        .eq('step', step)
        .filter('created_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      const failureCount = failures?.length || 0
      const attemptCount = new Set(attempts?.map(a => a.user_id) || []).size
      const failureRate = attemptCount > 0 ? (failureCount / attemptCount) * 100 : 0
      
      if (failureRate > 0) {
        const errorCounts: Record<string, number> = {}
        failures?.forEach(f => {
          if (f.error_message) {
            errorCounts[f.error_message] = (errorCounts[f.error_message] || 0) + 1
          }
        })
        
        const commonErrors = Object.entries(errorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([error]) => error)
        
        commonFailurePoints.push({
          step,
          failureRate,
          commonErrors,
        })
      }
    }
    
    // Get daily metrics
    const today = new Date().toISOString().split('T')[0]
    
    const { data: dailyStartedData } = await supabase
      .from('onboarding_progress')
      .select('user_id')
      .eq('step', 'profile_setup')
      .eq('status', 'started')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
    
    const { data: dailyCompletedData } = await supabase
      .from('washer_profiles')
      .select('user_id')
      .eq('onboarding_status', 'completed')
      .gte('onboarding_completed_at', `${today}T00:00:00.000Z`)
      .lt('onboarding_completed_at', `${today}T23:59:59.999Z`)
    
    const dailyStarted = new Set(dailyStartedData?.map(d => d.user_id) || []).size
    const dailyCompleted = dailyCompletedData?.length || 0
    
    return {
      totalUsers,
      completionRate,
      averageCompletionTime,
      stepCompletionRates,
      commonFailurePoints,
      dailyStarted,
      dailyCompleted,
    }
    
  } catch (error) {
    console.error('Error getting onboarding analytics:', error)
    return {
      totalUsers: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      stepCompletionRates: {} as any,
      commonFailurePoints: [],
      dailyStarted: 0,
      dailyCompleted: 0,
    }
  }
}

/**
 * Get users stuck at specific onboarding steps
 */
export async function getUsersStuckAtStep(
  step: OnboardingStatus,
  hoursStuck: number = 24
): Promise<Array<{
  userId: string
  email: string
  fullName?: string
  stuckSince: string
  lastActivity: string
}>> {
  const supabase = createSupabaseServerClient()
  
  try {
    const cutoffTime = new Date(Date.now() - hoursStuck * 60 * 60 * 1000).toISOString()
    
    const { data: stuckUsers } = await supabase
      .from('washer_profiles')
      .select(`
        user_id,
        last_step_completed_at,
        profiles!inner(email, full_name)
      `)
      .eq('onboarding_status', step)
      .lt('last_step_completed_at', cutoffTime)
    
    return stuckUsers?.map(user => ({
      userId: user.user_id,
      email: (user.profiles as any).email,
      fullName: (user.profiles as any).full_name,
      stuckSince: user.last_step_completed_at || '',
      lastActivity: user.last_step_completed_at || '',
    })) || []
    
  } catch (error) {
    console.error('Error getting users stuck at step:', error)
    return []
  }
}

/**
 * Clean up old onboarding progress entries
 */
export async function cleanupOldProgressEntries(daysToKeep: number = 90): Promise<void> {
  const supabase = createSupabaseServerClient()
  
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
    
    await supabase
      .from('onboarding_progress')
      .delete()
      .lt('created_at', cutoffDate)
      .in('status', ['completed', 'failed'])
    
  } catch (error) {
    console.error('Error cleaning up old progress entries:', error)
  }
}
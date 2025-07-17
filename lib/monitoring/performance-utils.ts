/**
 * Performance monitoring utilities (client-side)
 * These are utility functions that don't require server actions
 */

export interface OperationContext {
  userId?: string
  sessionId?: string
  operation: string
  metadata?: Record<string, any>
}

/**
 * Create a session ID for tracking user journeys
 */
export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get performance thresholds for alerting
 */
export const PERFORMANCE_THRESHOLDS = {
  stripe_account_create: 5000, // 5 seconds
  stripe_account_retrieve: 3000, // 3 seconds
  stripe_account_link_create: 3000, // 3 seconds
  db_profile_update: 1000, // 1 second
  db_profile_select: 500, // 500ms
  verification_callback_processing: 10000, // 10 seconds
  verification_status_check: 5000, // 5 seconds
} as const

/**
 * Check if operation exceeded performance threshold
 */
export function isSlowOperation(operation: string, duration: number): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[operation as keyof typeof PERFORMANCE_THRESHOLDS]
  return threshold ? duration > threshold : duration > 5000 // Default 5s threshold
}

/**
 * Log slow operation alert
 */
export function logSlowOperation(
  operation: string,
  duration: number,
  context: OperationContext
): void {
  const threshold = PERFORMANCE_THRESHOLDS[operation as keyof typeof PERFORMANCE_THRESHOLDS] || 5000
  
  console.warn(`[SLOW_OPERATION_ALERT] ${JSON.stringify({
    type: 'slow_operation',
    operation,
    duration_ms: duration,
    threshold_ms: threshold,
    exceeded_by_ms: duration - threshold,
    user_id: context.userId,
    session_id: context.sessionId,
    metadata: context.metadata,
    timestamp: new Date().toISOString()
  })}`)
}
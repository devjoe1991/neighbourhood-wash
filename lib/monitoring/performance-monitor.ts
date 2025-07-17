'use server'

import { verificationAnalytics } from './verification-analytics'
import { 
  isSlowOperation, 
  logSlowOperation, 
  type OperationContext 
} from './performance-utils'

/**
 * Performance monitoring utilities for Stripe API calls and verification operations
 * Implements performance monitoring requirements for task 11
 */

export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
  error?: {
    type: string
    message: string
    code?: string
  }
}



/**
 * Performance monitoring wrapper for async operations
 */
export async function withPerformanceMonitoring<T>(
  context: OperationContext,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  let success = false
  let error: Error | undefined

  try {
    const result = await operation()
    success = true
    return result
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    throw err
  } finally {
    const duration = Date.now() - startTime
    
    // Track the API call performance
    await verificationAnalytics.trackApiCall(
      context.operation,
      duration,
      success,
      context.userId,
      context.sessionId,
      error,
      context.metadata
    )

    // Log performance metric for immediate visibility
    console.log(`[PERFORMANCE_MONITOR] ${JSON.stringify({
      type: 'performance_metric',
      operation: context.operation,
      duration_ms: duration,
      success,
      user_id: context.userId,
      session_id: context.sessionId,
      error: error?.message,
      timestamp: new Date().toISOString()
    })}`)
  }
}

/**
 * Specialized wrapper for Stripe API calls
 */
export async function withStripeApiMonitoring<T>(
  operation: string,
  stripeCall: () => Promise<T>,
  context: {
    userId?: string
    sessionId?: string
    accountId?: string
    metadata?: Record<string, any>
  } = {}
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: `stripe_${operation}`,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        stripe_account_id: context.accountId,
        ...context.metadata
      }
    },
    stripeCall
  )
}

/**
 * Monitor database operations
 */
export async function withDatabaseMonitoring<T>(
  operation: string,
  dbCall: () => Promise<T>,
  context: {
    userId?: string
    sessionId?: string
    table?: string
    metadata?: Record<string, any>
  } = {}
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: `db_${operation}`,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        table: context.table,
        ...context.metadata
      }
    },
    dbCall
  )
}

/**
 * Monitor verification flow steps
 */
export async function withVerificationStepMonitoring<T>(
  step: string,
  stepOperation: () => Promise<T>,
  context: {
    userId: string
    sessionId: string
    accountId?: string
    metadata?: Record<string, any>
  }
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: `verification_${step}`,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        stripe_account_id: context.accountId,
        verification_step: step,
        ...context.metadata
      }
    },
    stepOperation
  )
}

// Note: Utility functions like createSessionId, PERFORMANCE_THRESHOLDS, 
// isSlowOperation, and logSlowOperation are available in './performance-utils'

/**
 * Enhanced performance monitoring with alerting
 */
export async function withEnhancedPerformanceMonitoring<T>(
  context: OperationContext,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await withPerformanceMonitoring(context, operation)
    
    const duration = Date.now() - startTime
    
    // Check for slow operations and alert
    if (isSlowOperation(context.operation, duration)) {
      logSlowOperation(context.operation, duration, context)
    }
    
    return result
  } catch (error) {
    // Error is already handled by withPerformanceMonitoring
    throw error
  }
}
'use server'

import { verificationAnalytics } from './verification-analytics'

/**
 * Server actions for verification analytics
 * These functions can be called from client components
 */

export async function trackVerificationStartedAction(
  userId: string, 
  sessionId: string,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackVerificationStarted(userId, sessionId, metadata)
}

export async function trackAccountCreatedAction(
  userId: string,
  accountId: string,
  sessionId: string,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackAccountCreated(userId, accountId, sessionId, duration, metadata)
}

export async function trackOnboardingLinkGeneratedAction(
  userId: string,
  accountId: string,
  sessionId: string,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackOnboardingLinkGenerated(userId, accountId, sessionId, duration, metadata)
}

export async function trackStripeRedirectAction(
  userId: string,
  accountId: string,
  sessionId: string,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackStripeRedirect(userId, accountId, sessionId, metadata)
}

export async function trackCallbackReceivedAction(
  userId: string,
  accountId: string,
  sessionId: string,
  previousStatus: string,
  currentStatus: string,
  statusChanged: boolean,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackCallbackReceived(
    userId, accountId, sessionId, previousStatus, currentStatus, statusChanged, duration, metadata
  )
}

export async function trackStatusUpdatedAction(
  userId: string,
  accountId: string,
  sessionId: string,
  previousStatus: string,
  currentStatus: string,
  requirements: any,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackStatusUpdated(
    userId, accountId, sessionId, previousStatus, currentStatus, requirements, metadata
  )
}

export async function trackVerificationCompletedAction(
  userId: string,
  accountId: string,
  sessionId: string,
  totalDuration: number,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackVerificationCompleted(userId, accountId, sessionId, totalDuration, metadata)
}

export async function trackVerificationFailedAction(
  userId: string,
  accountId: string | undefined,
  sessionId: string,
  error: Error,
  step: string,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackVerificationFailed(userId, accountId, sessionId, error, step, metadata)
}

export async function trackApiCallAction(
  operation: string,
  duration: number,
  success: boolean,
  userId?: string,
  sessionId?: string,
  error?: Error,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackApiCall(operation, duration, success, userId, sessionId, error, metadata)
}

export async function trackRetryAttemptAction(
  userId: string,
  sessionId: string,
  operation: string,
  attemptNumber: number,
  error: Error,
  metadata?: Record<string, any>
): Promise<void> {
  return verificationAnalytics.trackRetryAttempt(userId, sessionId, operation, attemptNumber, error, metadata)
}

export async function getVerificationMetricsAction(
  startDate?: string,
  endDate?: string
) {
  return verificationAnalytics.getVerificationMetrics(startDate, endDate)
}

export async function getUserJourneyAction(
  userId: string,
  sessionId?: string
) {
  return verificationAnalytics.getUserJourney(userId, sessionId)
}
'use client'

import { toast } from '@/lib/hooks/use-toast'
import { withRetry, getUserFriendlyErrorMessage, type RetryConfig } from '@/lib/error-handling'
import { logOnboardingStep } from '@/lib/onboarding-progress'

/**
 * Onboarding-specific error handling utilities
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export interface OnboardingError {
  step: number
  stepName: string
  error: unknown
  canRetry: boolean
  retryCount: number
  userId?: string
  sessionId?: string
}

export interface OnboardingErrorState {
  hasError: boolean
  error?: OnboardingError
  isRetrying: boolean
  retryCount: number
}

/**
 * Step-specific error messages for better user experience
 */
const STEP_ERROR_MESSAGES = {
  1: {
    title: 'Profile Setup Error',
    description: 'There was an issue saving your profile information.',
    retryMessage: 'Please check your information and try again.',
  },
  2: {
    title: 'Identity Verification Error',
    description: 'There was an issue with the identity verification process.',
    retryMessage: 'Please try the verification process again.',
  },
  3: {
    title: 'Bank Connection Error',
    description: 'There was an issue connecting your bank account.',
    retryMessage: 'Please try connecting your bank account again.',
  },
  4: {
    title: 'Payment Processing Error',
    description: 'There was an issue processing your onboarding fee payment.',
    retryMessage: 'Please try the payment again.',
  },
} as const

/**
 * Enhanced error handler for onboarding steps
 */
export class OnboardingErrorHandler {
  private static errorStates = new Map<string, OnboardingErrorState>()

  /**
   * Handle an error that occurred during an onboarding step
   */
  static async handleStepError(
    userId: string,
    step: number,
    error: unknown,
    sessionId?: string
  ): Promise<OnboardingErrorState> {
    const stepName = this.getStepName(step)
    const errorInfo = getUserFriendlyErrorMessage(error)
    
    // Get current retry count and increment it
    const currentRetryCount = this.getRetryCount(userId, step)
    const newRetryCount = currentRetryCount + 1
    
    // Log the error for audit trail
    await logOnboardingStep(
      userId,
      step,
      'error',
      'failed',
      { errorType: errorInfo.title || 'Error' },
      { error: error instanceof Error ? error.message : String(error) },
      sessionId
    )

    const onboardingError: OnboardingError = {
      step,
      stepName,
      error,
      canRetry: errorInfo.canRetry,
      retryCount: newRetryCount,
      userId,
      sessionId,
    }

    const errorState: OnboardingErrorState = {
      hasError: true,
      error: onboardingError,
      isRetrying: false,
      retryCount: newRetryCount,
    }

    this.errorStates.set(`${userId}-${step}`, errorState)
    
    // Show appropriate error toast
    this.showStepErrorToast(step, error, errorInfo.canRetry)
    
    return errorState
  }

  /**
   * Execute an onboarding step with retry logic and error handling
   */
  static async executeStepWithRetry<T>(
    userId: string,
    step: number,
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    sessionId?: string
  ): Promise<T> {
    const stepName = this.getStepName(step)
    
    // Clear any previous error state
    this.clearStepError(userId, step)
    
    try {
      // Log step start
      await logOnboardingStep(
        userId,
        step,
        'started',
        'in_progress',
        { stepName },
        null,
        sessionId
      )

      const result = await withRetry(
        operation,
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          ...retryConfig,
        },
        async (attempt, error) => {
          // Update retry count
          const currentState = this.errorStates.get(`${userId}-${step}`) || {
            hasError: false,
            isRetrying: true,
            retryCount: 0,
          }
          
          currentState.isRetrying = true
          currentState.retryCount = attempt
          this.errorStates.set(`${userId}-${step}`, currentState)

          // Log retry attempt
          await logOnboardingStep(
            userId,
            step,
            'retry',
            'in_progress',
            { attempt, stepName },
            { error: error instanceof Error ? error.message : String(error) },
            sessionId
          )

          // Show retry toast
          toast({
            title: `Retrying ${stepName}...`,
            description: `Attempt ${attempt} of 3`,
            variant: 'default',
          })
        }
      )

      // Log successful completion
      await logOnboardingStep(
        userId,
        step,
        'completed',
        'success',
        { stepName },
        null,
        sessionId
      )

      // Clear error state on success
      this.clearStepError(userId, step)
      
      // Show success toast
      this.showStepSuccessToast(step)
      
      return result
    } catch (error) {
      // Handle final failure
      await this.handleStepError(userId, step, error, sessionId)
      throw error
    }
  }

  /**
   * Get the current error state for a step
   */
  static getStepErrorState(userId: string, step: number): OnboardingErrorState | null {
    return this.errorStates.get(`${userId}-${step}`) || null
  }

  /**
   * Clear error state for a step
   */
  static clearStepError(userId: string, step: number): void {
    this.errorStates.delete(`${userId}-${step}`)
  }

  /**
   * Clear all error states for a user
   */
  static clearAllErrors(userId: string): void {
    for (let step = 1; step <= 4; step++) {
      this.clearStepError(userId, step)
    }
  }

  /**
   * Check if a step can be retried
   */
  static canRetryStep(userId: string, step: number): boolean {
    const errorState = this.getStepErrorState(userId, step)
    if (!errorState || !errorState.error) {
      return false
    }
    return errorState.error.canRetry && errorState.retryCount < 3
  }

  /**
   * Manually retry a failed step
   */
  static async retryStep(
    userId: string,
    step: number,
    operation: () => Promise<void>,
    sessionId?: string
  ): Promise<void> {
    const errorState = this.getStepErrorState(userId, step)
    
    if (!errorState || !this.canRetryStep(userId, step)) {
      throw new Error('Step cannot be retried')
    }

    // Update state to show retrying
    errorState.isRetrying = true
    this.errorStates.set(`${userId}-${step}`, errorState)

    try {
      await operation()
      this.clearStepError(userId, step)
      this.showStepSuccessToast(step)
    } catch (error) {
      await this.handleStepError(userId, step, error, sessionId)
      throw error
    }
  }

  /**
   * Get retry count for a step
   */
  private static getRetryCount(userId: string, step: number): number {
    const errorState = this.errorStates.get(`${userId}-${step}`)
    return errorState?.retryCount || 0
  }

  /**
   * Get human-readable step name
   */
  private static getStepName(step: number): string {
    const stepNames = {
      1: 'Profile Setup',
      2: 'Identity Verification',
      3: 'Bank Connection',
      4: 'Payment Processing',
    }
    return stepNames[step as keyof typeof stepNames] || `Step ${step}`
  }

  /**
   * Show error toast for a specific step
   */
  private static showStepErrorToast(step: number, error: unknown, canRetry: boolean): void {
    const stepMessage = STEP_ERROR_MESSAGES[step as keyof typeof STEP_ERROR_MESSAGES]
    const errorInfo = getUserFriendlyErrorMessage(error)
    
    toast({
      variant: 'destructive',
      title: stepMessage?.title || errorInfo.title,
      description: canRetry 
        ? stepMessage?.retryMessage || errorInfo.description
        : errorInfo.description,
    })
  }

  /**
   * Show success toast for step completion
   */
  private static showStepSuccessToast(step: number): void {
    const successMessages = {
      1: {
        title: 'Profile Setup Complete! ✅',
        description: 'Your profile information has been saved successfully.',
      },
      2: {
        title: 'Identity Verified! ✅',
        description: 'Your identity has been successfully verified.',
      },
      3: {
        title: 'Bank Account Connected! ✅',
        description: 'Your bank account has been connected for payouts.',
      },
      4: {
        title: 'Payment Complete! ✅',
        description: 'Your onboarding fee has been processed successfully.',
      },
    }

    const message = successMessages[step as keyof typeof successMessages]
    
    if (message) {
      toast({
        variant: 'success',
        title: message.title,
        description: message.description,
      })
    }
  }
}

/**
 * Hook for managing onboarding error state in components
 */
export function useOnboardingErrorHandler(userId: string, step: number) {
  const errorState = OnboardingErrorHandler.getStepErrorState(userId, step)
  
  const handleError = async (error: unknown, sessionId?: string) => {
    return await OnboardingErrorHandler.handleStepError(userId, step, error, sessionId)
  }
  
  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    sessionId?: string
  ): Promise<T> => {
    return await OnboardingErrorHandler.executeStepWithRetry(
      userId,
      step,
      operation,
      retryConfig,
      sessionId
    )
  }
  
  const retry = async (operation: () => Promise<void>, sessionId?: string) => {
    return await OnboardingErrorHandler.retryStep(userId, step, operation, sessionId)
  }
  
  const clearError = () => {
    OnboardingErrorHandler.clearStepError(userId, step)
  }
  
  const canRetry = OnboardingErrorHandler.canRetryStep(userId, step)
  
  return {
    errorState,
    hasError: errorState?.hasError || false,
    isRetrying: errorState?.isRetrying || false,
    canRetry,
    retryCount: errorState?.retryCount || 0,
    handleError,
    executeWithRetry,
    retry,
    clearError,
  }
}

/**
 * Recovery flow utilities for incomplete onboarding
 */
export class OnboardingRecovery {
  private static readonly RECOVERY_KEY = 'onboarding_recovery'
  
  /**
   * Save recovery state for interrupted onboarding
   */
  static saveRecoveryState(userId: string, step: number, data?: any): void {
    try {
      const recoveryData = {
        userId,
        step,
        data,
        timestamp: Date.now(),
        url: window.location.href,
      }
      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(recoveryData))
    } catch (error) {
      console.warn('Failed to save onboarding recovery state:', error)
    }
  }
  
  /**
   * Get recovery state if available
   */
  static getRecoveryState(): {
    userId: string
    step: number
    data?: any
    timestamp: number
    url: string
  } | null {
    try {
      const data = localStorage.getItem(this.RECOVERY_KEY)
      if (!data) return null
      
      const recoveryData = JSON.parse(data)
      
      // Recovery data expires after 1 hour
      if (Date.now() - recoveryData.timestamp > 60 * 60 * 1000) {
        this.clearRecoveryState()
        return null
      }
      
      return recoveryData
    } catch (error) {
      console.warn('Failed to get onboarding recovery state:', error)
      return null
    }
  }
  
  /**
   * Clear recovery state
   */
  static clearRecoveryState(): void {
    try {
      localStorage.removeItem(this.RECOVERY_KEY)
    } catch (error) {
      console.warn('Failed to clear onboarding recovery state:', error)
    }
  }
  
  /**
   * Check if recovery is available
   */
  static hasRecoveryState(): boolean {
    return this.getRecoveryState() !== null
  }
  
  /**
   * Show recovery prompt to user
   */
  static showRecoveryPrompt(onRecover: () => void, onDismiss: () => void): void {
    const recoveryState = this.getRecoveryState()
    if (!recoveryState) return
    
    toast({
      title: 'Resume Onboarding?',
      description: `You have an incomplete onboarding at step ${recoveryState.step}. Would you like to continue?`,
      variant: 'default',
      // Action would be handled in the component
    })
  }
}

/**
 * Loading state management for onboarding steps
 */
export class OnboardingLoadingManager {
  private static loadingStates = new Map<string, boolean>()
  
  static setLoading(userId: string, step: number, loading: boolean): void {
    this.loadingStates.set(`${userId}-${step}`, loading)
  }
  
  static isLoading(userId: string, step: number): boolean {
    return this.loadingStates.get(`${userId}-${step}`) || false
  }
  
  static clearLoading(userId: string): void {
    for (let step = 1; step <= 4; step++) {
      this.loadingStates.delete(`${userId}-${step}`)
    }
  }
}
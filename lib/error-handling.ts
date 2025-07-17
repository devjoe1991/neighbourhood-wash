import { toast } from '@/lib/hooks/use-toast'
import type { StripeError } from '@/lib/stripe/actions'

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

/**
 * Calculates delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay)
  
  // Add jitter (±25% of the delay)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.max(cappedDelay + jitter, config.baseDelay)
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === retryConfig.maxAttempts) {
        break
      }

      // Don't retry certain types of errors
      if (shouldNotRetry(error)) {
        break
      }

      const delay = calculateDelay(attempt, retryConfig)
      
      onRetry?.(attempt, error)
      
      console.log(`Retry attempt ${attempt}/${retryConfig.maxAttempts} after ${delay}ms delay`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Determines if an error should not be retried
 */
function shouldNotRetry(error: unknown): boolean {
  // Don't retry validation errors, auth errors, or user errors
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as StripeError
    return ['validation_error', 'auth_error'].includes(stripeError.type)
  }

  // Don't retry 4xx HTTP errors (except 429 rate limiting)
  if (error && typeof error === 'object' && 'status' in error) {
    const httpError = error as { status: number }
    return httpError.status >= 400 && httpError.status < 500 && httpError.status !== 429
  }

  return false
}

/**
 * Maps error types to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): {
  title: string
  description: string
  canRetry: boolean
  actionText?: string
} {
  // Handle StripeError types
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as StripeError
    
    switch (stripeError.type) {
      case 'stripe_error':
        return getStripeErrorMessage(stripeError)
      case 'network_error':
        return {
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection and try again.',
          canRetry: true,
          actionText: 'Retry'
        }
      case 'auth_error':
        return {
          title: 'Authentication Required',
          description: 'Please sign in again to continue.',
          canRetry: false,
          actionText: 'Sign In'
        }
      case 'validation_error':
        return {
          title: 'Invalid Information',
          description: stripeError.message || 'Please check your information and try again.',
          canRetry: false
        }
      default:
        return {
          title: 'Something Went Wrong',
          description: stripeError.message || 'An unexpected error occurred. Please try again.',
          canRetry: true,
          actionText: 'Try Again'
        }
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      title: 'Error',
      description: error.message || 'An unexpected error occurred. Please try again.',
      canRetry: true,
      actionText: 'Try Again'
    }
  }

  // Fallback for unknown errors
  return {
    title: 'Unexpected Error',
    description: 'Something unexpected happened. Please try again or contact support if the problem persists.',
    canRetry: true,
    actionText: 'Try Again'
  }
}

/**
 * Maps specific Stripe error codes to user-friendly messages
 */
function getStripeErrorMessage(error: StripeError): {
  title: string
  description: string
  canRetry: boolean
  actionText?: string
} {
  const code = error.code

  switch (code) {
    case 'account_invalid':
      return {
        title: 'Account Not Found',
        description: 'Your payment account could not be found. Please contact support for assistance.',
        canRetry: false,
        actionText: 'Contact Support'
      }
    case 'account_link_expired':
      return {
        title: 'Verification Link Expired',
        description: 'Your verification link has expired. We\'ll generate a new one for you.',
        canRetry: true,
        actionText: 'Get New Link'
      }
    case 'rate_limit':
      return {
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
        canRetry: true,
        actionText: 'Try Again Later'
      }
    case 'api_connection_error':
      return {
        title: 'Connection Error',
        description: 'Unable to connect to payment services. Please try again.',
        canRetry: true,
        actionText: 'Retry'
      }
    case 'api_error':
      return {
        title: 'Service Temporarily Unavailable',
        description: 'Our payment services are temporarily unavailable. Please try again in a few minutes.',
        canRetry: true,
        actionText: 'Try Again'
      }
    default:
      return {
        title: 'Payment Service Error',
        description: error.message || 'There was an issue with the payment service. Please try again.',
        canRetry: true,
        actionText: 'Try Again'
      }
  }
}

/**
 * Shows an error toast with retry option
 */
export function showErrorToast(
  error: unknown,
  onRetry?: () => void,
  customMessage?: { title?: string; description?: string }
) {
  const errorInfo = getUserFriendlyErrorMessage(error)
  
  toast({
    variant: 'destructive',
    title: customMessage?.title || errorInfo.title,
    description: customMessage?.description || errorInfo.description,
    action: errorInfo.canRetry && onRetry ? {
      label: errorInfo.actionText || 'Retry',
      onClick: onRetry
    } : undefined,
  })
}

/**
 * Shows a success toast for verification status changes
 */
export function showVerificationStatusToast(
  status: string,
  previousStatus?: string
) {
  const messages = {
    complete: {
      title: 'Verification Complete! 🎉',
      description: 'Your account is now fully verified and ready to accept bookings.',
      variant: 'success' as const
    },
    pending: {
      title: 'Verification Under Review',
      description: 'Your documents are being reviewed. This typically takes 1-2 business days.',
      variant: 'default' as const
    },
    requires_action: {
      title: 'Action Required',
      description: 'Additional information is needed to complete your verification.',
      variant: 'warning' as const
    },
    rejected: {
      title: 'Verification Issues',
      description: 'There were issues with your verification. Please contact support.',
      variant: 'destructive' as const
    }
  }

  const message = messages[status as keyof typeof messages]
  
  if (message && status !== previousStatus) {
    toast({
      variant: message.variant,
      title: message.title,
      description: message.description,
    })
  }
}

/**
 * Shows a loading toast that can be updated
 */
export function showLoadingToast(message: string) {
  return toast({
    title: 'Processing...',
    description: message,
    variant: 'default',
  })
}

/**
 * Recovery flow helper for incomplete verifications
 */
export class VerificationRecovery {
  private static readonly RECOVERY_KEY = 'verification_recovery'
  
  static saveRecoveryState(userId: string, accountId: string, step: string) {
    try {
      const recoveryData = {
        userId,
        accountId,
        step,
        timestamp: Date.now(),
      }
      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(recoveryData))
    } catch (error) {
      console.warn('Failed to save recovery state:', error)
    }
  }
  
  static getRecoveryState(): {
    userId: string
    accountId: string
    step: string
    timestamp: number
  } | null {
    try {
      const data = localStorage.getItem(this.RECOVERY_KEY)
      if (!data) return null
      
      const recoveryData = JSON.parse(data)
      
      // Recovery data expires after 24 hours
      if (Date.now() - recoveryData.timestamp > 24 * 60 * 60 * 1000) {
        this.clearRecoveryState()
        return null
      }
      
      return recoveryData
    } catch (error) {
      console.warn('Failed to get recovery state:', error)
      return null
    }
  }
  
  static clearRecoveryState() {
    try {
      localStorage.removeItem(this.RECOVERY_KEY)
    } catch (error) {
      console.warn('Failed to clear recovery state:', error)
    }
  }
  
  static hasRecoveryState(): boolean {
    return this.getRecoveryState() !== null
  }
}
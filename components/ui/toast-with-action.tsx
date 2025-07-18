'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { toast, type ToastActionElement } from '@/lib/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

/**
 * Enhanced toast utilities with action support for onboarding
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export interface ToastWithActionOptions {
  title: string
  description: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'destructive'
    loading?: boolean
  }
  duration?: number
  dismissible?: boolean
}

/**
 * Show toast with optional action button
 */
export function showToastWithAction(options: ToastWithActionOptions) {
  const {
    title,
    description,
    variant = 'default',
    action,
    duration,
  } = options

  let actionElement: ToastActionElement | undefined

  if (action) {
    actionElement = (
      <Button
        variant={action.variant || 'outline'}
        size="sm"
        onClick={action.onClick}
        disabled={action.loading}
        className="ml-auto"
      >
        {action.loading && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
        {action.label}
      </Button>
    ) as ToastActionElement
  }

  return toast({
    title,
    description,
    variant,
    action: actionElement,
    duration,
  })
}

/**
 * Show error toast with retry option
 */
export function showErrorToastWithRetry(
  title: string,
  description: string,
  onRetry: () => void,
  canRetry: boolean = true,
  retryLabel: string = 'Try Again'
) {
  return showToastWithAction({
    title,
    description,
    variant: 'destructive',
    action: canRetry ? {
      label: retryLabel,
      onClick: onRetry,
      variant: 'outline',
    } : undefined,
  })
}

/**
 * Show success toast with optional action
 */
export function showSuccessToast(
  title: string,
  description: string,
  action?: {
    label: string
    onClick: () => void
  }
) {
  return showToastWithAction({
    title,
    description,
    variant: 'success',
    action,
  })
}

/**
 * Show loading toast that can be updated
 */
export function showLoadingToast(
  title: string,
  description: string,
  onCancel?: () => void
) {
  return showToastWithAction({
    title,
    description,
    variant: 'default',
    action: onCancel ? {
      label: 'Cancel',
      onClick: onCancel,
      variant: 'outline',
    } : undefined,
    duration: 0, // Don't auto-dismiss loading toasts
    dismissible: false,
  })
}

/**
 * Show warning toast with action
 */
export function showWarningToast(
  title: string,
  description: string,
  action?: {
    label: string
    onClick: () => void
  }
) {
  return showToastWithAction({
    title,
    description,
    variant: 'warning',
    action,
  })
}

/**
 * Show step completion toast
 */
export function showStepCompletionToast(
  stepNumber: number,
  stepName: string,
  nextAction?: {
    label: string
    onClick: () => void
  }
) {
  return showToastWithAction({
    title: `${stepName} Complete! ✅`,
    description: `Step ${stepNumber} has been completed successfully.`,
    variant: 'success',
    action: nextAction,
  })
}

/**
 * Show step error toast with retry
 */
export function showStepErrorToast(
  stepNumber: number,
  stepName: string,
  error: string,
  onRetry?: () => void,
  canRetry: boolean = true
) {
  return showToastWithAction({
    title: `${stepName} Failed`,
    description: error,
    variant: 'destructive',
    action: canRetry && onRetry ? {
      label: 'Retry Step',
      onClick: onRetry,
      variant: 'outline',
    } : undefined,
  })
}

/**
 * Show recovery prompt toast
 */
export function showRecoveryPrompt(
  stepNumber: number,
  onRecover: () => void,
  _onDismiss: () => void
) {
  return showToastWithAction({
    title: 'Resume Onboarding?',
    description: `You have incomplete onboarding at step ${stepNumber}. Would you like to continue?`,
    variant: 'default',
    action: {
      label: 'Continue',
      onClick: onRecover,
    },
    duration: 0, // Don't auto-dismiss
  })
}

/**
 * Update an existing toast (useful for loading states)
 */
export function updateToast(
  toastId: string,
  options: Partial<ToastWithActionOptions>
) {
  // This would need to be implemented in the toast hook
  // For now, we'll dismiss the old toast and show a new one
  toast.dismiss?.(toastId)
  return showToastWithAction(options as ToastWithActionOptions)
}

/**
 * Onboarding-specific toast presets
 */
export const OnboardingToasts = {
  profileSetupStart: () => showLoadingToast(
    'Saving Profile...',
    'Your profile information is being saved.'
  ),
  
  profileSetupSuccess: () => showSuccessToast(
    'Profile Setup Complete! ✅',
    'Your profile information has been saved successfully.'
  ),
  
  profileSetupError: (error: string, onRetry: () => void) => 
    showErrorToastWithRetry(
      'Profile Setup Failed',
      error,
      onRetry
    ),
  
  kycStart: () => showLoadingToast(
    'Starting Identity Verification...',
    'Redirecting you to secure verification process.'
  ),
  
  kycSuccess: () => showSuccessToast(
    'Identity Verified! ✅',
    'Your identity has been successfully verified.'
  ),
  
  kycError: (error: string, onRetry: () => void) =>
    showErrorToastWithRetry(
      'Identity Verification Failed',
      error,
      onRetry
    ),
  
  bankConnectionStart: () => showLoadingToast(
    'Connecting Bank Account...',
    'Setting up your bank account for payouts.'
  ),
  
  bankConnectionSuccess: () => showSuccessToast(
    'Bank Account Connected! ✅',
    'Your bank account has been connected for payouts.'
  ),
  
  bankConnectionError: (error: string, onRetry: () => void) =>
    showErrorToastWithRetry(
      'Bank Connection Failed',
      error,
      onRetry
    ),
  
  paymentStart: () => showLoadingToast(
    'Processing Payment...',
    'Your onboarding fee is being processed.'
  ),
  
  paymentSuccess: () => showSuccessToast(
    'Payment Complete! ✅',
    'Your onboarding fee has been processed successfully.',
    {
      label: 'Access Dashboard',
      onClick: () => window.location.reload()
    }
  ),
  
  paymentError: (error: string, onRetry: () => void) =>
    showErrorToastWithRetry(
      'Payment Failed',
      error,
      onRetry
    ),
  
  onboardingComplete: () => showSuccessToast(
    'Onboarding Complete! 🎉',
    'Welcome to the platform! You now have full access to all features.',
    {
      label: 'Explore Dashboard',
      onClick: () => window.location.reload()
    }
  ),
  
  networkError: (onRetry: () => void) =>
    showErrorToastWithRetry(
      'Connection Problem',
      'Unable to connect to our servers. Please check your internet connection.',
      onRetry
    ),
  
  sessionExpired: () => showToastWithAction({
    title: 'Session Expired',
    description: 'Please sign in again to continue.',
    variant: 'warning',
    action: {
      label: 'Sign In',
      onClick: () => window.location.href = '/signin'
    }
  }),
}
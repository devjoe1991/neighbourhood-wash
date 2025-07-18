'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  isLoading: boolean
  step: number
  stepName: string
  message?: string
  progress?: number
  error?: string
  success?: boolean
  className?: string
}

/**
 * Enhanced loading state component for onboarding steps
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function OnboardingLoadingState({
  isLoading,
  step,
  stepName,
  message,
  progress,
  error,
  success,
  className
}: LoadingStateProps) {
  if (!isLoading && !error && !success) {
    return null
  }

  const getIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-red-600" />
    if (success) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (isLoading) return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    return <Clock className="w-5 h-5 text-gray-400" />
  }

  const getVariant = () => {
    if (error) return 'border-red-200 bg-red-50'
    if (success) return 'border-green-200 bg-green-50'
    if (isLoading) return 'border-blue-200 bg-blue-50'
    return 'border-gray-200 bg-gray-50'
  }

  const getTextColor = () => {
    if (error) return 'text-red-900'
    if (success) return 'text-green-900'
    if (isLoading) return 'text-blue-900'
    return 'text-gray-900'
  }

  const getDescriptionColor = () => {
    if (error) return 'text-red-700'
    if (success) return 'text-green-700'
    if (isLoading) return 'text-blue-700'
    return 'text-gray-700'
  }

  return (
    <Card className={cn(getVariant(), className)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-medium', getTextColor())}>
                {error ? `${stepName} Failed` : 
                 success ? `${stepName} Complete` :
                 isLoading ? `Processing ${stepName}...` :
                 stepName}
              </h4>
              
              {step && (
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  Step {step}
                </span>
              )}
            </div>
            
            {message && (
              <p className={cn('text-sm', getDescriptionColor())}>
                {message}
              </p>
            )}
            
            {error && (
              <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                {error}
              </p>
            )}
            
            {progress !== undefined && isLoading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-blue-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Multi-step loading indicator
 */
interface MultiStepLoadingProps {
  steps: Array<{
    id: number
    name: string
    status: 'pending' | 'loading' | 'complete' | 'error'
    message?: string
    error?: string
  }>
  currentStep: number
  className?: string
}

export function MultiStepLoadingIndicator({ 
  steps, 
  currentStep, 
  className 
}: MultiStepLoadingProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isPast = step.id < currentStep
        
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg transition-all',
              {
                'bg-blue-50 border border-blue-200': isActive && step.status === 'loading',
                'bg-green-50 border border-green-200': step.status === 'complete',
                'bg-red-50 border border-red-200': step.status === 'error',
                'bg-gray-50 border border-gray-200': step.status === 'pending',
              }
            )}
          >
            <div className="flex-shrink-0">
              {step.status === 'loading' && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              {step.status === 'complete' && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              {step.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              {step.status === 'pending' && (
                <div className={cn(
                  'w-4 h-4 rounded-full border-2',
                  isPast ? 'bg-gray-300 border-gray-300' : 'border-gray-300'
                )} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-sm font-medium',
                  {
                    'text-blue-900': isActive && step.status === 'loading',
                    'text-green-900': step.status === 'complete',
                    'text-red-900': step.status === 'error',
                    'text-gray-600': step.status === 'pending',
                  }
                )}>
                  {step.name}
                </span>
                
                <span className="text-xs text-gray-500">
                  Step {step.id}
                </span>
              </div>
              
              {step.message && (
                <p className={cn(
                  'text-xs mt-1',
                  {
                    'text-blue-700': isActive && step.status === 'loading',
                    'text-green-700': step.status === 'complete',
                    'text-red-700': step.status === 'error',
                    'text-gray-500': step.status === 'pending',
                  }
                )}>
                  {step.message}
                </p>
              )}
              
              {step.error && (
                <p className="text-xs text-red-700 mt-1 bg-red-100 p-1 rounded">
                  {step.error}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Simple loading overlay for buttons and forms
 */
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Skeleton loader for onboarding forms
 */
export function OnboardingFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  )
}
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, Shield, Clock, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface VerificationLoadingStateProps {
  stage: 'initializing' | 'creating_account' | 'generating_link' | 'redirecting' | 'processing_callback' | 'updating_status'
  message?: string
  progress?: number
  showProgress?: boolean
  retryCount?: number
  maxRetries?: number
}

const STAGE_CONFIG = {
  initializing: {
    icon: Loader2,
    title: 'Initializing Verification',
    description: 'Setting up your verification process...',
    progress: 10,
  },
  creating_account: {
    icon: Shield,
    title: 'Creating Payment Account',
    description: 'Setting up your secure payment account with our partner...',
    progress: 30,
  },
  generating_link: {
    icon: Clock,
    title: 'Generating Verification Link',
    description: 'Creating your personalized verification link...',
    progress: 60,
  },
  redirecting: {
    icon: CheckCircle,
    title: 'Redirecting to Verification',
    description: 'Taking you to the secure verification process...',
    progress: 90,
  },
  processing_callback: {
    icon: Loader2,
    title: 'Processing Verification',
    description: 'Updating your verification status...',
    progress: 70,
  },
  updating_status: {
    icon: CheckCircle,
    title: 'Finalizing Setup',
    description: 'Completing your account setup...',
    progress: 95,
  },
}

export function VerificationLoadingState({
  stage,
  message,
  progress,
  showProgress = true,
  retryCount = 0,
  maxRetries = 3
}: VerificationLoadingStateProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const config = STAGE_CONFIG[stage]
  const Icon = config.icon
  const displayProgress = progress ?? config.progress

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(displayProgress)
    }, 100)
    return () => clearTimeout(timer)
  }, [displayProgress])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Icon className={`w-8 h-8 text-blue-600 dark:text-blue-400 ${
              Icon === Loader2 ? 'animate-spin' : ''
            }`} />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {config.title}
            {retryCount > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Retry {retryCount}/{maxRetries})
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {message || config.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Progress</span>
                <span>{animatedProgress}%</span>
              </div>
              <Progress 
                value={animatedProgress} 
                className="h-2"
              />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please don't close this window or navigate away.
            </p>
            {stage === 'redirecting' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                If you're not redirected automatically, please refresh the page.
              </p>
            )}
          </div>

          {/* Loading dots animation */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook to manage verification loading states
 */
export function useVerificationLoading() {
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean
    stage: VerificationLoadingStateProps['stage']
    message?: string
    progress?: number
    retryCount?: number
  }>({
    isLoading: false,
    stage: 'initializing'
  })

  const startLoading = (
    stage: VerificationLoadingStateProps['stage'], 
    message?: string,
    retryCount = 0
  ) => {
    setLoadingState({
      isLoading: true,
      stage,
      message,
      retryCount
    })
  }

  const updateStage = (
    stage: VerificationLoadingStateProps['stage'], 
    message?: string,
    progress?: number
  ) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      message,
      progress
    }))
  }

  const stopLoading = () => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }))
  }

  return {
    loadingState,
    startLoading,
    updateStage,
    stopLoading,
    LoadingComponent: loadingState.isLoading ? (
      <VerificationLoadingState
        stage={loadingState.stage}
        message={loadingState.message}
        progress={loadingState.progress}
        retryCount={loadingState.retryCount}
      />
    ) : null
  }
}
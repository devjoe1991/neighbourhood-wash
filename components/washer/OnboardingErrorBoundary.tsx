'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { OnboardingErrorHandler } from '@/lib/onboarding-error-handling'

interface Props {
  children: ReactNode
  userId?: string
  step?: number
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  retryCount: number
}

/**
 * Error boundary specifically for onboarding flow
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export class OnboardingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Onboarding Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Log error to onboarding system if we have user and step info
    if (this.props.userId && this.props.step) {
      OnboardingErrorHandler.handleStepError(
        this.props.userId,
        this.props.step,
        error
      ).catch(console.error)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }))

    // Clear any error state in the error handler
    if (this.props.userId && this.props.step) {
      OnboardingErrorHandler.clearStepError(this.props.userId, this.props.step)
    }
  }

  handleGoHome = () => {
    window.location.href = '/washer/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-900">
                  Something Went Wrong
                </h3>
                <p className="text-sm text-red-700">
                  {this.state.error?.message || 
                   'An unexpected error occurred during the onboarding process.'}
                </p>
                
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-red-600">
                    Retry attempt: {this.state.retryCount}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping onboarding steps with error boundary
 */
export function withOnboardingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  step?: number
) {
  return function WrappedComponent(props: P & { userId?: string }) {
    return (
      <OnboardingErrorBoundary userId={props.userId} step={step}>
        <Component {...props} />
      </OnboardingErrorBoundary>
    )
  }
}
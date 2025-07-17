'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

interface VerificationErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface VerificationErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    retry: () => void
    retryCount: number
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
}

export class VerificationErrorBoundary extends React.Component<
  VerificationErrorBoundaryProps,
  VerificationErrorBoundaryState
> {
  constructor(props: VerificationErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<VerificationErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('VerificationErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error for monitoring (in production, you might want to send this to a logging service)
    this.logError(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      retryCount: this.state.retryCount,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }

    console.error('[VERIFICATION_ERROR_BOUNDARY]', JSON.stringify(errorLog, null, 2))
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))
    }
  }

  private handleGoHome = () => {
    window.location.href = '/washer/dashboard'
  }

  private handleContactSupport = () => {
    const subject = encodeURIComponent('Verification Error - Need Help')
    const body = encodeURIComponent(`
Hi Support Team,

I encountered an error while using the washer verification system.

Error Details:
- Error: ${this.state.error?.message || 'Unknown error'}
- Time: ${new Date().toISOString()}
- Page: ${window.location.href}
- Retry Count: ${this.state.retryCount}

Please help me resolve this issue.

Thank you!
    `)
    
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            retry={this.handleRetry}
            retryCount={this.state.retryCount}
          />
        )
      }

      // Default error UI
      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
          <Card className="w-full max-w-2xl border-red-200 dark:border-red-800">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
                Verification System Error
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300 mt-2">
                Something went wrong with the verification process
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p className="font-medium">{this.state.error?.name || 'Unknown Error'}</p>
                    <p className="text-sm mt-1">{this.state.error?.message || 'An unexpected error occurred'}</p>
                    {this.state.retryCount > 0 && (
                      <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                        Retry attempts: {this.state.retryCount}/{maxRetries}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What you can do:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Try refreshing the page or retrying the operation</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Try again in a few minutes</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleContactSupport}
                  className="flex items-center justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Developer Information (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-auto">
                    <div className="mb-2">
                      <strong>Error Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to wrap components with verification error boundary
 */
export function withVerificationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<VerificationErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <VerificationErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </VerificationErrorBoundary>
    )
  }
}
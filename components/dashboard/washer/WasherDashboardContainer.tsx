'use client'

import React, { useEffect, useState } from 'react'
import { ModernWasherDashboard } from './ModernWasherDashboard'
import { WasherOnboardingContainer } from '@/components/washer/WasherOnboardingContainer'
import { VerificationStatusBanner } from '@/components/washer/VerificationStatusBanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface WasherProfile {
  id: string
  user_id: string
  onboarding_status: string
  approval_status: string
  stripe_account_status?: string
  rating: number
  total_jobs: number
  completed_jobs: number
  cancellation_rate: number
  is_online: boolean
  service_areas: string[]
  service_types: string[]
  availability_schedule: any
}

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface WasherDashboardContainerProps {
  user: User
  washerProfile: WasherProfile | null
}

export function WasherDashboardContainer({ user, washerProfile }: WasherDashboardContainerProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // No washer profile - redirect to become washer
  if (!washerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Washer Profile Not Found</CardTitle>
            <CardDescription>
              You need to apply to become a washer first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                Please apply to become a washer through the customer dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check onboarding status
  const isOnboardingComplete = washerProfile.onboarding_status === 'completed'
  const isApproved = washerProfile.approval_status === 'approved'

  // If onboarding is not complete, show onboarding flow
  if (!isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Complete Your Washer Setup
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Follow these steps to unlock your full washer dashboard
              </p>
            </div>

            <WasherOnboardingContainer user={user} />
          </div>
        </div>
      </div>
    )
  }

  // If not approved yet, show pending approval state
  if (!isApproved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome to Your Washer Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Your application is being reviewed
              </p>
            </div>

            {washerProfile.stripe_account_status && (
              <VerificationStatusBanner
                status={washerProfile.stripe_account_status as any}
                accountId={washerProfile.id}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Application Under Review</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Thank you for completing your washer onboarding! Your application is currently being reviewed by our team.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Background check verification (1-2 business days)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Document review and approval</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Account activation and dashboard access</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm text-gray-500">
                    You'll receive an email notification once your application has been approved.
                    If you have any questions, please contact our support team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Fully approved and onboarded - show modern dashboard
  return <ModernWasherDashboard washerProfile={washerProfile} user={user} />
}
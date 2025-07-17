import { AlertCircle, Search, Lock } from 'lucide-react'
import { requireCompleteOnboarding } from '@/lib/middleware/washer-verification'
import { getAvailableBookings } from '../actions'
import AvailableBookingsClient from './AvailableBookingsClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AvailableBookingsPage() {
  // Check authentication, washer status, and 4-step onboarding completion
  // Requirements: 7.1, 7.2 - Prevent access to available bookings for incomplete washers
  const onboardingStatus = await requireCompleteOnboarding(false) // Don't redirect, show locked state
  
  // If onboarding is not complete, show locked state with clear messaging
  if (!onboardingStatus.isComplete) {
    return (
      <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl'>
            Available Bookings
          </h1>
          <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
            Complete your setup to access available bookings.
          </p>
        </div>

        {/* Access Denied Alert */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Setup Required</AlertTitle>
          <AlertDescription className="text-orange-700">
            You need to complete all 4 onboarding steps to access available bookings.
            {onboardingStatus.missingSteps.length > 0 && (
              <>
                <br />
                <strong>Missing steps:</strong> {onboardingStatus.missingSteps.join(', ')}
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Locked Feature Preview */}
        <Card className='mx-auto max-w-lg border-2 border-dashed border-gray-300 bg-gray-50/50'>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className='h-8 w-8 text-gray-400' />
            </div>
            <CardTitle className="text-gray-500">Available Bookings</CardTitle>
            <CardDescription className="text-gray-400">
              Browse and accept laundry bookings in your area
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className='text-gray-400 text-sm'>
              This feature will be unlocked once you complete your 4-step setup process.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center text-xs text-gray-400">
                <span>✓ Real-time booking notifications</span>
              </div>
              <div className="flex items-center justify-center text-xs text-gray-400">
                <span>✓ Flexible acceptance options</span>
              </div>
              <div className="flex items-center justify-center text-xs text-gray-400">
                <span>✓ Competitive pricing</span>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/washer/dashboard">
                Complete Setup to Unlock
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await getAvailableBookings()

  if (!result.success) {
    return (
      <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl'>
            Available Bookings
          </h1>
          <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
            Browse and accept laundry bookings in your area.
          </p>
        </div>

        <Card className='mx-auto max-w-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-700 dark:text-gray-300'>
              {result.message || 'Failed to fetch available bookings.'}
            </p>
            <p className='mt-2 text-sm text-gray-500'>
              Please try refreshing the page. If the problem persists, contact
              support.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookings = result.data || []

  return (
    <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl'>
          Available Bookings
        </h1>
        <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
          Browse and accept laundry bookings in your area. New jobs are posted
          regularly.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className='mx-auto max-w-lg'>
          <CardHeader className='items-center text-center'>
            <div className='mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
              <Search className='h-8 w-8 text-primary' />
            </div>
            <CardTitle>No Available Bookings</CardTitle>
            <CardDescription>
              There are no new jobs in your area right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-center'>
              <p className='text-gray-600 dark:text-gray-400'>
                Check back later, or make sure your service area is set
                correctly in your settings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AvailableBookingsClient bookings={bookings} />
      )}
    </div>
  )
}

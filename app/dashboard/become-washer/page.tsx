'use client' // This page now requires client-side state for the toggle

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' // Use client for fetch on interaction
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Rocket,
  ListChecks,
  UserCheck,
  AlertCircle,
  Clock,
  Award,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { startWasherApplicationProcess } from '@/app/auth/actions'
import { Badge } from '@/components/ui/badge'

// Note: We convert this to a client component to manage the state
// of showing/hiding the full application form.
// We'll fetch initial data via a client-side useEffect hook.

export default function BecomeWasherPage() {
  const [profile, setProfile] = useState<{
    role: string
    washer_status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, washer_status')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError(
            'Could not load your profile information. Please try again later.'
          )
        } else {
          setProfile(profileData)
        }
      } else {
        redirect('/signin')
      }
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [])

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='loader'>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!profile) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Profile Not Found</AlertTitle>
        <AlertDescription>
          We couldn&apos;t find a profile for your account. Please contact
          support.
        </AlertDescription>
      </Alert>
    )
  }

  // If the user has ANY washer status, show the relevant status card.
  if (profile.washer_status) {
    // Sanitize the status to remove potential quotes from DB entry and trim whitespace
    const status = profile.washer_status?.trim().replace(/['"]+/g, '') ?? ''

    switch (status) {
      case 'pending_application':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Continue Your Application</CardTitle>
              <CardDescription>
                You have already started the process. Complete your application
                to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='mb-4'>
                Please proceed to the application form to provide more details
                about your services and equipment.
              </p>
              <Button asChild>
                <Link href='/dashboard/washer-application'>
                  Continue Application
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      case 'approved':
      case 'appoved': // Handle soft-launch: approved means pending final review
        return (
          <div className='mx-auto w-full max-w-3xl'>
            <Card className='overflow-hidden text-center'>
              <CardHeader className='bg-yellow-50 p-8'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100'>
                  <Clock className='h-10 w-10 text-yellow-600' />
                </div>
                <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
                  Application Pending Final Review
                </h1>
                <p className='mt-2 text-gray-600'>
                  Our admin team is working hard to review your application in
                  time for our full launch.
                </p>
                <div className='mt-4'>
                  <Badge
                    variant='outline'
                    className='border-yellow-300 bg-yellow-200 text-yellow-800'
                  >
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='p-8'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  What&apos;s Next?
                </h2>
                <p className='mt-2 text-gray-600'>
                  You will be updated via email on your application status. Once
                  we&apos;re ready for the full launch, you will gain access to
                  your Washer Hub to set up your services and start earning.
                </p>
                <div className='mt-6'>
                  <Button size='lg' disabled>
                    Go to Your Washer Hub (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case 'pending_verification':
        return (
          <div className='mx-auto w-full max-w-3xl space-y-8'>
            <Card className='overflow-hidden text-center'>
              <CardHeader className='bg-green-50 p-6'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                  <Clock className='h-8 w-8 text-green-600' />
                </div>
                <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
                  You&apos;re Almost There!
                </h1>
                <p className='text-md mt-2 text-gray-600'>
                  We&apos;ve received your application and are conducting our
                  final review. This is the last step before you&apos;re
                  officially unlocked as a Neighbourhood Washer!
                </p>
                <div className='pt-4'>
                  <span className='inline-flex items-center rounded-full border border-transparent bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800 capitalize'>
                    Pending Final Review
                  </span>
                </div>
              </CardHeader>
              <CardContent className='p-6 text-left'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  What Happens Next?
                </h2>
                <p className='mt-2 text-gray-600'>
                  We are carefully reviewing your application to ensure the
                  highest quality and safety for our community. As one of our
                  pioneer Washers, you&apos;re getting in on the ground floor.
                  <span className='font-semibold text-gray-700'>
                    {' '}
                    We will be in contact via email as soon as your verification
                    is complete.
                  </span>
                </p>
                <div className='my-6 border-t'></div>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Frequently Asked Questions
                </h3>
                <Accordion type='single' collapsible className='mt-2 w-full'>
                  <AccordionItem value='item-1'>
                    <AccordionTrigger>Why is there a wait?</AccordionTrigger>
                    <AccordionContent>
                      <p>
                        As part of our soft launch, we&apos;re carefully
                        onboarding our first group of pioneer Washers. This
                        ensures we can provide the best support and gather
                        feedback to make the platform great for everyone. Your
                        patience helps us build a better service!
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value='item-2'>
                    <AccordionTrigger>
                      How long does verification take?
                    </AccordionTrigger>
                    <AccordionContent>
                      <p>
                        Verification times can vary, but we aim to complete it
                        within 3-5 business days. Since you&apos;re part of our
                        initial launch, we appreciate your understanding as we
                        finalize our processes.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )
      case 'rejected':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Application Update</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                After careful review, we are unable to approve your application
                at this time. Please check your email for more details.
              </p>
            </CardContent>
          </Card>
        )
      default:
        // Fallback for any other status
        return (
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Your application status is: {status}. Please check back later or
                contact support if you have questions.
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  // If user has no washer_status, show the main application info page
  return (
    <div className='mx-auto w-full max-w-4xl space-y-8'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
          <Rocket className='h-8 w-8 text-blue-600' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
          Become a Neighbourhood Washer
        </h1>
        <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
          Join our trusted community of local laundry experts and start earning
          on your own schedule.
        </p>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader className='bg-gray-50 p-6'>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            A simple, flexible way to turn your laundry skills into income.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='grid gap-8 md:grid-cols-3'>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <UserCheck className='h-6 w-6 text-blue-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold'>1. Apply & Qualify</h3>
              <p className='text-sm text-gray-600'>
                Submit your application. We&apos;ll verify your details to
                ensure our community&apos;s safety and trust.
              </p>
            </div>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <ListChecks className='h-6 w-6 text-blue-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold'>
                2. Set Up Your Service
              </h3>
              <p className='text-sm text-gray-600'>
                Once approved, you&apos;ll set your prices, service area, and
                the types of laundry services you offer.
              </p>
            </div>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <Award className='h-6 w-6 text-blue-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold'>3. Start Earning</h3>
              <p className='text-sm text-gray-600'>
                Accept jobs that fit your schedule, communicate with customers,
                and get paid securely through the platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='text-center'>
        <form action={startWasherApplicationProcess}>
          <Button type='submit' size='lg'>
            Start My Application
          </Button>
        </form>
        <p className='mt-4 text-sm text-gray-500'>
          The application takes about 5-10 minutes to complete.
        </p>
      </div>
    </div>
  )
}

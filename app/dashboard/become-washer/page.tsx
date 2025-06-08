'use client' // This page now requires client-side state for the toggle

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' // Use client for fetch on interaction
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RegisterInterestForm from '@/components/dashboard/RegisterInterestForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Rocket,
  ListChecks,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Mail,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
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

// Note: We convert this to a client component to manage the state
// of showing/hiding the full application form.
// We'll fetch initial data via a client-side useEffect hook.

// Simplified placeholder for the user object type.
// In a real app, you'd likely have a more robust type definition.
type UserProfile = {
  id: string
  role: string
  washer_status: string | null
  phone?: string | null
  [key: string]: unknown // Allow other properties
}

const statusConfig = {
  pending_verification: {
    title: "You're on the list! Welcome to the Neighbourhood.",
    description:
      "You've successfully submitted your application and are officially part of our early-access group for the soft launch. We're thrilled to have you!",
    icon: <Clock className='h-6 w-6 text-yellow-500' />,
  },
  approved: {
    title: "Congratulations! You're an approved Washer!",
    description:
      "Welcome to the community! You're all set to start accepting jobs. Head to your Washer Hub to manage your services and availability.",
    icon: <CheckCircle className='h-6 w-6 text-green-500' />,
  },
  rejected: {
    title: 'Update on your Washer Application',
    description:
      'After careful review, we are unable to approve your application at this time. Please check your email for more details. If you have any questions, please contact our support team.',
    icon: <XCircle className='h-6 w-6 text-red-500' />,
  },
  default: {
    title: 'Application Status Update',
    description:
      'Your application has been processed. You will be notified of any status changes.',
    icon: <Award className='h-6 w-6 text-gray-500' />,
  },
}

const getBadgeClasses = (status: string): string => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  switch (status) {
    case 'pending_verification':
      return `${baseClasses} bg-yellow-100 text-yellow-800 border-transparent`;
    case 'approved':
      return `${baseClasses} bg-success text-white border-transparent`;
    case 'rejected':
      return `${baseClasses} bg-error text-white border-transparent`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 border-transparent`;
  }
}

export default function BecomeWasherPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interestRegistered, setInterestRegistered] = useState(false)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
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
          // Also check if they have registered interest if they don't have a washer_status yet
          if (!profileData.washer_status && profileData.role !== 'washer') {
            const { data: interestData } = await supabase
              .from('washer_interest_registrations')
              .select('id')
              .eq('user_id', user.id)
              .single()
            if (interestData) {
              setInterestRegistered(true)
            }
          }
        }
      } else {
        redirect('/signin')
      }
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [])

  const handleInterestRegistered = () => {
    setInterestRegistered(true)
  }

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
                You have already started the process. Complete your
                application to get started.
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
      case 'pending_verification':
        return (
          <div className='mx-auto w-full max-w-3xl space-y-8'>
            <Card className='overflow-hidden text-center'>
              <CardHeader className='bg-green-50 p-6'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                  <Clock className='h-8 w-8 text-green-600' />
                </div>
                <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
                  You're Almost There!
                </h1>
                <p className='mt-2 text-md text-gray-600'>
                  We've received your application and are conducting our final
                  review. This is the last step before you're officially
                  unlocked as a Neighbourhood Washer!
                </p>
                <div className='pt-4'>
                  <span className='inline-flex items-center rounded-full border border-transparent bg-yellow-100 px-3 py-1 text-sm font-semibold capitalize text-yellow-800'>
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
                  pioneer Washers, you're getting in on the ground floor.
                  <span className='font-semibold text-gray-700'>
                    {' '}
                    We will be in contact via email as soon as your
                    verification is complete.
                  </span>
                </p>
                <div className='my-6 border-t'></div>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Frequently Asked Questions
                </h3>
                <Accordion type='single' collapsible className='w-full mt-2'>
                  <AccordionItem value='item-1'>
                    <AccordionTrigger>Why is there a wait?</AccordionTrigger>
                    <AccordionContent>
                      You&apos;re in at the perfect time! We are currently in
                      our soft-launch phase, which means we&apos;re rapidly
                      growing our community of users. To ensure there&apos;s
                      plenty of work for you from day one, we are verifying new
                      Washers in batches to align with our full platform launch.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value='item-2'>
                    <AccordionTrigger>
                      How long does verification take?
                    </AccordionTrigger>
                    <AccordionContent>
                      During the soft-launch period, the timeline for final
                      approval can vary. It&apos;s about timing your onboarding
                      with the official launch in your area to maximize your
                      earning potential. We appreciate your patience!
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )
      case 'appoved': // Handle typo from DB
      case 'approved':
        return (
          <div className='mx-auto w-full max-w-3xl space-y-8'>
            <Card className='overflow-hidden text-center'>
              <CardHeader className='bg-green-50 p-6'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                  <CheckCircle className='h-8 w-8 text-green-600' />
                </div>
                <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
                  You're In! Welcome to the Neighbourhood!
                </h1>
                <p className='mt-2 text-md text-gray-600'>
                  Congratulations! Your application is approved and you're ready
                  to start earning.
                </p>
                <div className='pt-4'>
                  <span className='inline-flex items-center rounded-full border border-transparent bg-green-200 px-3 py-1 text-sm font-semibold capitalize text-green-800'>
                    Approved
                  </span>
                </div>
              </CardHeader>
              <CardContent className='p-6 text-left'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  What's Next?
                </h2>
                <p className='mt-2 text-gray-600'>
                  Your account is fully unlocked. The next step is to head over
                  to your personal Washer Hub to set up your services, define
                  your availability, and get ready for your first customer.
                </p>
                <div className='mt-6 flex justify-center'>
                  <Button asChild size='lg'>
                    <Link href='/dashboard/washer-hub'>
                      Go to Your Washer Hub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case 'rejected':
        return (
          <Card>
            <CardHeader className='text-center'>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <CardTitle className="mt-4">Application Status Update</CardTitle>
            </CardHeader>
            <CardContent className='text-center'>
              <p>
                After careful review, we are unable to approve your
                application at this time. Please check your email for more
                details. If you have any questions, please contact our
                support team.
              </p>
            </CardContent>
          </Card>
        )
      default:
        // Fallback for any other unexpected status
        return <p>Unknown application status: '{profile.washer_status}'</p>
    }
  }

  // Only show this if the user has NO washer_status at all.
  return (
    <div className='space-y-6'>
      <Card className='text-center'>
        <CardHeader className='px-4 pt-8 pb-6'>
          <CardTitle className='text-2xl font-bold tracking-tight md:text-3xl'>
            Ready to Become a Neighbourhood Washer?
          </CardTitle>
          <CardDescription className='pt-2 text-md text-gray-600'>
            Join our community of trusted locals and start earning from your
            laundry room.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-8 px-4 pb-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='flex flex-col items-center space-y-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <Rocket className='h-6 w-6 text-primary' />
              </div>
              <h3 className='font-semibold'>Be the First</h3>
              <p className='text-sm text-gray-600'>
                Get priority access and be among the first Washers in your
                area.
              </p>
            </div>
            <div className='flex flex-col items-center space-y-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <ListChecks className='h-6 w-6 text-primary' />
              </div>
              <h3 className='font-semibold'>Simple & Secure</h3>
              <p className='text-sm text-gray-600'>
                Our straightforward application process gets you started
                quickly and securely.
              </p>
            </div>
            <div className='flex flex-col items-center space-y-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <UserCheck className='h-6 w-6 text-primary' />
              </div>
              <h3 className='font-semibold'>Join the Community</h3>
              <p className='text-sm text-gray-600'>
                Your feedback is invaluable in building the best experience for
                Washers.
              </p>
            </div>
          </div>
          <div className='border-t pt-6'>
            <form action={startWasherApplicationProcess}>
              <Button
                type='submit'
                size='lg'
                className='w-full font-semibold sm:w-auto'
              >
                Start Your Application
              </Button>
            </form>
            <p className='mt-4 text-xs text-gray-500'>
              By applying, you agree to our terms of service and verification
              process.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

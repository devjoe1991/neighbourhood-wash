'use client' // This page now requires client-side state for the toggle

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' // Use client for fetch on interaction
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RegisterInterestForm from '@/components/dashboard/RegisterInterestForm'
import WasherApplicationForm from '@/components/dashboard/NewWasherApplicationForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PartyPopper, Rocket } from 'lucide-react'

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

export default function BecomeWasherPage() {
  const [showFullApplication, setShowFullApplication] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // useEffect to fetch initial user status
  // This replaces the server-side data fetching
  useEffect(() => {
    const fetchUserStatus = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return // Or redirect
      }

      // Fetch profile and interest registration in parallel
      const [profileRes, interestRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('washer_interest_registrations')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (profileRes.data) {
        setUserProfile(profileRes.data as UserProfile)
      }

      setHasRegisteredInterest(!!interestRes.data)
      setIsLoading(false)
    }

    fetchUserStatus()
  }, [])

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <p>Loading your details...</p>
      </div>
    )
  }

  const isApprovedWasher = userProfile?.washer_status === 'approved'

  // This is the content shown if the user has ALREADY submitted a full application
  const isApplicationPending =
    userProfile?.washer_status === 'pending_verification'

  if (isApplicationPending) {
    return (
      <Alert>
        <Rocket className='h-4 w-4' />
        <AlertTitle>Application Submitted & Pending Review</AlertTitle>
        <AlertDescription>
          Thanks for submitting your application! We are currently reviewing it
          and will get back to you soon.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='rounded-lg bg-white p-6 shadow-md sm:p-8'>
      <h1 className='mb-6 text-3xl font-bold text-blue-600'>
        Become a Neighbourhood Washer
      </h1>

      {isApprovedWasher ? (
        <div>
          <p className='text-lg text-gray-700'>
            You are an approved Neighbourhood Washer! Manage your services from
            your Washer Hub.
          </p>
          <Link href='/dashboard/washer-hub'>
            <Button className='mt-4'>Go to Washer Hub</Button>
          </Link>
        </div>
      ) : hasRegisteredInterest && !showFullApplication ? (
        <div className='rounded-md bg-green-50 p-6 text-center'>
          <h3 className='text-xl font-semibold text-green-700'>
            <PartyPopper className='mx-auto mb-2 h-8 w-8' />
            Interest Registered!
          </h3>
          <p className='mt-2 text-gray-600'>
            Thank you! We&apos;ll be in touch soon. If you&apos;re ready to get
            fully set up now, you can start the full application below.
          </p>
          <Button
            onClick={() => setShowFullApplication(true)}
            className='mt-4'
            variant='outline'
          >
            Start Full Application
          </Button>
        </div>
      ) : showFullApplication ? (
        <WasherApplicationForm user={userProfile} />
      ) : (
        <>
          <p className='mb-4 text-lg text-gray-700'>
            Turn your laundry appliances into an income source. Choose how you
            want to start.
          </p>
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Option 1: Register Interest */}
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-6'>
              <h2 className='mb-3 text-xl font-semibold text-gray-800'>
                Just Register Interest
              </h2>
              <p className='mb-4 text-sm text-gray-600'>
                Not ready for the full application? Just give us your postcode
                so we know where to launch next. We&apos;ll email you when
                we&apos;re ready for you.
              </p>
              <RegisterInterestForm />
            </div>

            {/* Option 2: Full Application */}
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
              <h2 className='mb-3 text-xl font-semibold text-blue-700'>
                Apply Now
              </h2>
              <p className='mb-4 text-sm text-gray-600'>
                Ready to go? Complete the full application to get verified and
                start accepting laundry jobs as soon as possible.
              </p>
              <Button onClick={() => setShowFullApplication(true)}>
                Start Full Application
              </Button>
            </div>
          </div>
          <p className='mt-8 text-sm text-gray-500'>
            <b>Please Note:</b> A full application and verification process is
            required to become an approved Neighbourhood Washer.
          </p>
        </>
      )}
    </div>
  )
}

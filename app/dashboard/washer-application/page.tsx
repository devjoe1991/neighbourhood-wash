'use client'

import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import WasherApplicationForm from '@/components/dashboard/WasherApplicationForm'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function WasherApplicationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{
    role: string
    washer_status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
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
      <div className='container mx-auto max-w-4xl py-10'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='container mx-auto max-w-4xl py-10'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>
            We couldn&apos;t find a profile for your account. Please contact
            support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Redirect if user is not a 'washer' role or has already applied/been approved.
  if (
    profile.role !== 'washer' ||
    (profile.washer_status && profile.washer_status !== 'pending_application')
  ) {
    return (
      <div className='container mx-auto max-w-4xl py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Application Status: {profile.washer_status}</CardTitle>
            <CardDescription>
              Your application is currently being reviewed, or has already been
              processed. You will be notified of any status changes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Allow access if role is 'washer' and status is 'pending_application'
  if (
    profile.role === 'washer' &&
    profile.washer_status === 'pending_application'
  ) {
    return (
      <div className='container mx-auto max-w-4xl py-10'>
        <div className='mb-4'>
          <Link
            href='/dashboard'
            className='flex items-center text-sm text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Link>
        </div>
        <WasherApplicationForm user={user} />
      </div>
    )
  }

  // Fallback for any other state
  redirect('/dashboard')
}

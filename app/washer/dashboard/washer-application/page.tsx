import { createSupabaseServerClient } from '@/utils/supabase/server'
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

interface UserProfile {
  role: string
  washer_status: string
}

async function getUserAndProfile(): Promise<{
  user: { id: string; phone?: string | null } | null
  profile: UserProfile | null
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null, error: 'Authentication required' }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, washer_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return {
        user,
        profile: null,
        error:
          'Could not load your profile information. Please try again later.',
      }
    }

    return { user, profile: profileData, error: null }
  } catch (error) {
    console.error('Error in getUserAndProfile:', error)
    return { user: null, profile: null, error: 'An unexpected error occurred' }
  }
}

export default async function WasherApplicationPage() {
  const { user, profile, error } = await getUserAndProfile()

  if (!user) {
    redirect('/signin')
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

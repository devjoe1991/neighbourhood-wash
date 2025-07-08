'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type SignInWithPasswordCredentials } from '@supabase/supabase-js'

export async function signOut() {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    // Optionally, redirect to an error page or show a message
    // For now, we'll still try to redirect to home,
    // as sign out errors are less common and often session becomes invalid anyway.
  }

  return redirect('/') // Redirect to the homepage after sign out
}

export async function signInWithEmailPassword(
  credentials: SignInWithPasswordCredentials
) {
  const supabase = createSupabaseServerClient()

  const { error: signInError } =
    await supabase.auth.signInWithPassword(credentials)

  if (signInError) {
    return {
      error: { message: signInError.message, type: 'CredentialsSignin' },
    }
  }

  // If signIn is successful, check user role for redirection
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (getUserError || !user) {
    console.error(
      'Error fetching user after sign in or user is null:',
      getUserError
    )
    // Fallback redirect if user data can't be fetched, though this is unlikely after successful sign-in
    return redirect('/dashboard')
  }

  // Check user profile for role (more reliable than metadata)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const userRole =
    profile?.role || user.user_metadata?.role || user.app_metadata?.role

  if (userRole === 'admin') {
    console.log('Admin user identified, redirecting to /admin/dashboard')
    return redirect('/admin/dashboard')
  } else if (userRole === 'washer') {
    console.log('Washer user identified, redirecting to /washer/dashboard')
    return redirect('/washer/dashboard')
  }

  console.log('Regular user, redirecting to /dashboard')
  return redirect('/dashboard')
}

export async function registerInterest(location: string) {
  'use server'
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'You must be logged in to do that.' } }
  }

  const { data, error } = await supabase
    .from('washer_interest_registrations')
    .insert([
      {
        user_id: user.id,
        email: user.email, // Storing email for easier contact
        postcode_or_borough: location,
        status: 'registered',
      },
    ])

  if (error) {
    console.error('Error registering interest:', error)
    // A more specific error might be useful for the client
    if (error.code === '23505') {
      // Postgres unique violation
      return {
        error: { message: 'You have already registered your interest.' },
      }
    }
    return { error: { message: 'Could not register interest.' } }
  }

  return { data }
}

interface WasherApplicationData {
  phone_number: string
  service_address: string
  service_offerings: string[]
  offers_collection?: boolean
  collection_radius?: number
  collection_fee?: number
  equipment_details: string
  washer_bio: string
}

export async function applyToBeWasher(applicationData: WasherApplicationData) {
  'use server'
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'You must be logged in to apply.' } }
  }

  // Fetch the user's profile to get the profile_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile for application:', profileError)
    return { error: { message: 'Could not find your user profile.' } }
  }

  // 1. Insert into washer_applications table
  const applicationInsert = {
    user_id: user.id,
    profile_id: profile.id,
    ...applicationData,
  }

  const { error: insertError } = await supabase
    .from('washer_applications')
    .insert(applicationInsert)

  if (insertError) {
    console.error('Error inserting washer application:', insertError)
    if (insertError.code.includes('23505')) {
      // unique_violation
      return { error: { message: 'You already have a pending application.' } }
    }
    return { error: { message: 'Failed to submit application.' } }
  }

  // 2. Update the profile status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      washer_status: 'pending_verification',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    // This is a bit tricky. The application was inserted, but status update failed.
    // For now, we'll log it and the user will see a generic error.
    // A more robust solution might involve a transaction or a cleanup job.
    console.error(
      'CRITICAL: Application inserted but profile status update failed:',
      updateError
    )
    return { error: { message: 'Failed to update your application status.' } }
  }

  return { data: { message: 'Application submitted successfully!' } }
}

export async function startWasherApplicationProcess() {
  'use server'
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin')
  }

  // First, check if they already have a profile that is in some washer state
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('washer_status')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error(
      'Error fetching profile before starting application:',
      profileError
    )
    return redirect('/dashboard/become-washer?error=profile_fetch_failed')
  }

  // If they are already in the process, just redirect them
  if (profile.washer_status) {
    return redirect('/dashboard/become-washer')
  }

  // Update the user's profile to start the application process
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      role: 'washer',
      washer_status: 'pending_application',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile to start application:', updateError)
    return redirect('/dashboard/become-washer?error=profile_update_failed')
  }

  // Revalidate the paths to ensure the UI updates correctly after the redirect.
  revalidatePath('/dashboard/become-washer')
  revalidatePath('/dashboard/washer-application')

  // On success, redirect to the application form
  redirect('/dashboard/washer-application')
}

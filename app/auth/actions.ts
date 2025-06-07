'use server'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import { type SignInWithPasswordCredentials } from '@supabase/supabase-js'

export async function signOut() {
  const supabase = createClient()

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
  const supabase = createClient()

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

  // Check for admin role - adjust if you store the role differently (e.g., app_metadata)
  const userRole = user.user_metadata?.role || user.app_metadata?.role

  if (userRole === 'admin') {
    console.log('Admin user identified, redirecting to /admin/dashboard')
    return redirect('/admin/dashboard')
  }

  console.log('Non-admin user, redirecting to /dashboard')
  return redirect('/dashboard')
}

export async function registerInterest(location: string) {
  'use server'
  const supabase = createClient()

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

  // TODO: Add Zod validation on the server-side for security
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'You must be logged in to apply.' } }
  }

  // Map client-side data to your 'profiles' table columns
  const profileUpdate = {
    phone_number: applicationData.phone_number,
    service_address: applicationData.service_address,
    service_offerings: applicationData.service_offerings,
    offers_collection: applicationData.offers_collection,
    collection_radius: applicationData.collection_radius,
    collection_fee: applicationData.collection_fee,
    equipment_details: applicationData.equipment_details,
    washer_bio: applicationData.washer_bio,
    washer_status: 'pending_verification', // Update status
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile for washer application:', error)
    return { error: { message: 'Failed to submit application.' } }
  }

  return { data }
}

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type SignInWithPasswordCredentials } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth/auth-service'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function signOut() {
  const result = await AuthService.signOut()

  if (!result.success) {
    console.error('Error signing out:', result.error)
    return { error: { message: result.error?.message || 'Failed to sign out. Please try again.' } }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signInWithEmailPassword(
  credentials: SignInWithPasswordCredentials
) {
  // Extract email and password from credentials object
  const email = 'email' in credentials ? credentials.email : ''
  const password = credentials.password
  
  const result = await AuthService.signIn(email, password)

  if (!result.success) {
    return {
      error: { 
        message: result.error?.message || 'Authentication failed', 
        type: result.error?.type || 'CredentialsSignin' 
      },
    }
  }

  // Redirect based on the result
  if (result.redirectTo) {
    console.log(`User authenticated, redirecting to ${result.redirectTo}`)
    return redirect(result.redirectTo)
  }

  // Fallback redirect (shouldn't happen with new service)
  console.log('No redirect specified, falling back to user dashboard')
  return redirect('/user/dashboard')
}

export async function registerInterest(location: string) {
  'use server'
  const user = await AuthService.getCurrentUser()

  if (!user) {
    return { error: { message: 'You must be logged in to do that.' } }
  }

  // This function remains largely the same as it's not directly related to the new auth architecture
  const supabase = createSupabaseServerClient()
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
  const user = await AuthService.getCurrentUser()

  if (!user) {
    return { error: { message: 'You must be logged in to apply.' } }
  }

  // This function will need to be updated to work with the new washer profile system
  // For now, we'll keep the legacy functionality but add a note
  const supabase = createSupabaseServerClient()

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

  // 1. Insert into washer_applications table (legacy)
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

  // 2. Assign washer role and create washer profile using new architecture
  const roleResult = await AuthService.assignRole(user.id, 'washer')
  if (!roleResult.success) {
    console.error('Error assigning washer role:', roleResult.error)
    return { error: { message: 'Failed to assign washer role.' } }
  }

  return { data: { message: 'Application submitted successfully!' } }
}

export async function startWasherApplicationProcess() {
  'use server'
  const user = await AuthService.getCurrentUser()

  if (!user) {
    return redirect('/signin')
  }

  // Check if user already has washer role
  const hasWasherRole = await AuthService.userHasRole(user.id, 'washer')
  
  if (hasWasherRole) {
    // Get user with roles to check onboarding status
    const userWithRoles = await AuthService.getUserWithRoles(user.id)
    
    if (userWithRoles?.washerProfile?.onboarding_status === 'completed') {
      return redirect('/washer/dashboard')
    } else {
      return redirect('/washer/onboarding')
    }
  }

  // Assign washer role and create profile
  const roleResult = await AuthService.assignRole(user.id, 'washer')
  
  if (!roleResult.success) {
    console.error('Error assigning washer role:', roleResult.error)
    return redirect('/user/dashboard/become-washer?error=role_assignment_failed')
  }

  // Revalidate the paths to ensure the UI updates correctly after the redirect.
  revalidatePath('/user/dashboard/become-washer')
  revalidatePath('/washer/onboarding')

  // Redirect to new onboarding flow
  redirect('/washer/onboarding')
}

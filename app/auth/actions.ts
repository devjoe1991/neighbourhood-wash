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

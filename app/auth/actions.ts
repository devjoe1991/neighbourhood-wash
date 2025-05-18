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

  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    return { error: { message: error.message, type: 'CredentialsSignin' } } // Mimic NextAuth-like error structure for client
  }

  // If signIn is successful, Supabase client automatically handles cookies.
  // The redirect will cause Next.js to re-render layouts/pages with fresh server-side user state.
  return redirect('/dashboard')
}

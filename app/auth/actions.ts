'use server'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'

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

'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const referralCode = formData.get('referral_code') as string
  const role = (formData.get('role') as string) || 'user'
  const supabase = createSupabaseServerClient()

  // Prepare metadata
  const metadata: {
    selected_role: string
    submitted_referral_code?: string
  } = {
    selected_role: role,
  }

  if (referralCode && referralCode.trim() !== '') {
    metadata.submitted_referral_code = referralCode.trim().toUpperCase()
  }

  // Sign up the user
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (signUpError) {
    console.error('Sign up error:', signUpError)
    return redirect('/signup?message=Could not authenticate user')
  }

  if (!user) {
    return redirect('/signup?message=Could not authenticate user')
  }

  // Create a profile for the new user
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: metadata.selected_role,
  })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    return redirect('/signup?message=Could not create user profile.')
  }

  // Process referral code if provided
  if (metadata.submitted_referral_code) {
    try {
      // Find the referrer
      const { data: referrerData, error: referrerError } = await supabase
        .from('referrals')
        .select('user_id, referral_code')
        .eq('referral_code', metadata.submitted_referral_code)
        .single()

      if (!referrerError && referrerData && referrerData.user_id !== user.id) {
        // Create referral event
        const { error: referralEventError } = await supabase
          .from('referral_events')
          .insert({
            referrer_user_id: referrerData.user_id,
            referred_user_id: user.id,
            referral_code_used: metadata.submitted_referral_code,
            status: 'pending_first_action',
          })

        if (referralEventError && referralEventError.code !== '23505') {
          // Log error but don't fail signup for referral issues
          console.error('Error creating referral event:', referralEventError)
        }
      }
    } catch (error) {
      // Log error but don't fail signup for referral issues
      console.error('Error processing referral:', error)
    }
  }

  // Success! Redirect based on user role
  if (metadata.selected_role === 'washer') {
    return redirect('/washer/dashboard')
  } else {
    return redirect('/user/dashboard')
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient' // Assuming your Supabase client is here
// import { User } from '@supabase/supabase-js' // Removed unused import

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      // The Supabase client library should automatically handle the session
      // when it detects auth tokens in the URL hash.
      // We just need to wait for the session to be established.

      // Wait a brief moment for Supabase to process the hash
      await new Promise((resolve) => setTimeout(resolve, 100))

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setError('Error processing authentication. Please try signing in.')
        setTimeout(() => router.push('/signin'), 3000)
        return
      }

      if (session && session.user) {
        const user = session.user
        // The user is now signed in because the email was confirmed.
        // Let's get their role from user_metadata.
        // The role was set during signup in user_metadata.selected_role

        const userRole =
          user.user_metadata?.selected_role || user.app_metadata?.selected_role

        setMessage('Email confirmed successfully! Redirecting...')

        if (userRole === 'washer') {
          router.push('/washer/dashboard')
        } else if (userRole === 'user') {
          router.push('/dashboard') // Default user dashboard
        } else {
          // Fallback if role is not found, though it should be set during signup
          console.warn(
            'User role not found in metadata after email confirmation.'
          )
          setError('Role not found. Please sign in to continue.')
          setTimeout(
            () =>
              router.push('/signin?message=Email confirmed. Please sign in.'),
            3000
          )
        }
      } else {
        // This case might happen if the link was invalid, expired, or already used.
        console.warn('No active session after email confirmation attempt.')
        // Check if there are specific query params indicating the type of event.
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        )
        const type = hashParams.get('type')

        if (type === 'signup') {
          setMessage('Email confirmed! Please sign in to access your account.')
          setTimeout(
            () =>
              router.push('/signin?message=Email confirmed. Please sign in.'),
            3000
          )
        } else if (type === 'recovery') {
          // This page primarily handles signup, but if a recovery link somehow lands here:
          setMessage(
            'Password recovery process initiated. Redirecting to reset password page...'
          )
          router.push('/reset-password?' + hashParams.toString()) // Forward params
        } else {
          setError(
            'Authentication failed or session expired. Please try signing in.'
          )
          setTimeout(() => router.push('/signin'), 3000)
        }
      }
    }

    // Check if there are auth tokens in the URL hash
    if (window.location.hash.includes('access_token')) {
      handleAuthCallback()
    } else {
      // If no auth token, maybe it's an old link or direct navigation.
      // Redirect to sign-in as this page is only for callbacks.
      setMessage('No authentication data found. Redirecting to sign-in...')
      setTimeout(() => router.push('/signin'), 2000)
    }
  }, [router])

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 py-12 sm:px-6 lg:px-8'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold text-blue-700'>{message}</h2>
        {error && <p className='mt-4 text-red-600'>Error: {error}</p>}
        {!error && (
          <p className='mt-4 text-gray-600'>
            Please wait while we securely redirect you.
          </p>
        )}
        {/* You can add a spinner here */}
      </div>
    </div>
  )
}

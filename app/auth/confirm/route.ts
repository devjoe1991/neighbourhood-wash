import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/signin' // Redirect to sign-in page after confirmation

  // Create a Supabase client for server-side operations
  const supabase = createSupabaseServerClient()

  // Log the confirmation attempt for debugging
  console.log('Email confirmation attempt:', { token_hash: token_hash ? 'present' : 'missing', type })

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      console.log('Email confirmation successful')
      // Redirect to the sign-in page after successful email confirmation
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('Email confirmation error:', error.message)
      // Add error details to the redirect URL for better debugging
      const errorUrl = new URL('/auth/auth-code-error', request.url)
      errorUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(errorUrl)
    }
  }

  console.error('Email confirmation failed: Missing token_hash or type')
  // Redirect to an error page if the confirmation fails
  const errorUrl = new URL('/auth/auth-code-error', request.url)
  errorUrl.searchParams.set('error', 'Missing confirmation parameters')
  return NextResponse.redirect(errorUrl)
}

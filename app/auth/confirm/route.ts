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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Redirect to the sign-in page after successful email confirmation
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect to an error page if the confirmation fails
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}

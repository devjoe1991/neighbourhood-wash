import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server' // Using the existing server client utility

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // If "next" is in params, use it, otherwise default to "/dashboard"
  // This allows for flexibility if Supabase sends a 'next' parameter in the future
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createSupabaseServerClient() // This initializes Supabase client using cookies from next/headers
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the 'next' path (defaulting to /dashboard)
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Auth callback error during code exchange:', error.message)
  } else {
    console.error('Auth callback error: No code provided in the URL.')
  }

  // If there was an error or no code, redirect to the sign-in page with an error message.
  const redirectUrl = new URL('/signin', origin)
  redirectUrl.searchParams.set('error', 'auth_callback_failed')
  redirectUrl.searchParams.set(
    'message',
    'Could not verify your email. Please try signing in, or contact support if the issue persists.'
  )
  return NextResponse.redirect(redirectUrl)
}

import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server' // Using the existing server client utility

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // If "next" is in params, use it, otherwise determine based on user role
  const next = searchParams.get('next')

  if (code) {
    const supabase = createSupabaseServerClient() // This initializes Supabase client using cookies from next/headers
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If we have a specific next path, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise, determine redirect based on user role
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check user profile for role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          const userRole = profile?.role || user.user_metadata?.selected_role

          // Redirect based on role
          switch (userRole) {
            case 'admin':
              return NextResponse.redirect(`${origin}/admin/dashboard`)
            case 'washer':
              return NextResponse.redirect(`${origin}/washer/dashboard`)
            default:
              // Default to regular user dashboard
              return NextResponse.redirect(`${origin}/user/dashboard`)
          }
        }
      } catch (roleError) {
        console.error('Error fetching user role:', roleError)
      }

      // Fallback to dashboard if role detection fails
      return NextResponse.redirect(`${origin}/user/dashboard`)
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

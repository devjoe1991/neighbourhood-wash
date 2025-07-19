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
          // Check if profile exists, create if it doesn't
          const { data: existingProfile, error: profileCheckError } =
            await supabase
              .from('profiles')
              .select('id, role')
              .eq('id', user.id)
              .maybeSingle()

          let userRole = existingProfile?.role

          // If no profile exists, create one using user metadata
          if (!existingProfile && !profileCheckError) {
            const selectedRole = user.user_metadata?.selected_role || 'user'

            console.log(
              `[AUTH_CALLBACK] Creating profile for user ${user.id} with role: ${selectedRole}`
            )

            const { error: profileCreationError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email,
                role: selectedRole,
                // For washers, set initial washer_status
                ...(selectedRole === 'washer' && {
                  washer_status: 'pending_application',
                }),
              })

            if (profileCreationError) {
              console.error(
                'Error creating profile in callback:',
                profileCreationError
              )
              // Continue anyway, using metadata role for redirect
            } else {
              console.log(
                `[AUTH_CALLBACK] Successfully created profile for user ${user.id}`
              )
            }

            userRole = selectedRole
          }

          // Fallback to metadata if profile role is not available
          if (!userRole) {
            userRole = user.user_metadata?.selected_role || 'user'
          }

          // Redirect based on role
          console.log(
            `[AUTH_CALLBACK] Redirecting user ${user.id} with role: ${userRole}`
          )
          switch (userRole) {
            case 'admin':
              console.log(
                `[AUTH_CALLBACK] Redirecting admin to /admin/dashboard`
              )
              return NextResponse.redirect(`${origin}/admin/dashboard`)
            case 'washer':
              console.log(
                `[AUTH_CALLBACK] Redirecting washer to /washer/dashboard`
              )
              return NextResponse.redirect(`${origin}/washer/dashboard`)
            default:
              console.log(`[AUTH_CALLBACK] Redirecting user to /user/dashboard`)
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

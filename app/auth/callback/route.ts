import { NextResponse, type NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import type { UserRole } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') as UserRole
  const next = searchParams.get('next')

  if (!code) {
    console.error('Auth callback error: No code provided in the URL.')
    return redirectToSignInWithError(origin, 'No verification code provided')
  }

  try {
    // If we have a specific next path, use it
    if (next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Use the new AuthService to handle the callback
    const result = await AuthService.handleAuthCallback(code, role)

    console.log(`[AUTH_CALLBACK] Redirecting to: ${result.url}`)
    return NextResponse.redirect(`${origin}${result.url}`)

  } catch (error) {
    console.error('Auth callback error:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Could not verify your email'
    
    return redirectToSignInWithError(origin, errorMessage)
  }
}

function redirectToSignInWithError(origin: string, message: string): NextResponse {
  const redirectUrl = new URL('/signin', origin)
  redirectUrl.searchParams.set('error', 'auth_callback_failed')
  redirectUrl.searchParams.set('message', message)
  return NextResponse.redirect(redirectUrl)
}

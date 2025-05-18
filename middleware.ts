import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware' // Adjusted path if utils is at root

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}`)
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers), // Copy headers to the new response
    },
  })

  const supabase = await createClient(request, response) // Pass request and response

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    console.log('[Middleware] Session FOUND')
  } else {
    console.log('[Middleware] Session NOT FOUND')
  }

  const { pathname } = request.nextUrl

  // Define protected and public paths
  const protectedPaths = ['/dashboard'] // Add any other routes you want to protect
  const publicAuthPaths = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ]

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )
  const isPublicAuthPath = publicAuthPaths.some((path) =>
    pathname.startsWith(path)
  )

  console.log(
    `[Middleware] isProtectedRoute: ${isProtectedRoute}, isPublicAuthPath: ${isPublicAuthPath}`
  )

  if (!session && isProtectedRoute) {
    console.log(
      '[Middleware] No session, protected route. Redirecting to /signin.'
    )
    // No session and trying to access a protected route, redirect to signin
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', pathname) // Optional: pass where the user was going
    return NextResponse.redirect(url)
  }

  if (session && isPublicAuthPath) {
    console.log(
      '[Middleware] Session found, public auth path. Redirecting to /dashboard.'
    )
    // User is logged in but trying to access signin/signup, redirect to dashboard (or home)
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // Or perhaps '/' if dashboard doesn't exist yet
    return NextResponse.redirect(url)
  }

  // Refresh session if it exists. `createMiddlewareClient` handles cookie updates on `response`.
  // The getSession() call above also initiates a refresh if needed.
  // If you needed to explicitly call refresh, it would be:
  // if (session) { await supabase.auth.refreshSession() }

  console.log('[Middleware] Passing through.')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images if you have /public/images)
     * - assets (public assets if you have /public/assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
  ],
}

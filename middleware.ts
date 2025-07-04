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

  // Fetch user details if a session exists to check for admin role
  let userRole = null
  if (session) {
    console.log('[Middleware] Session FOUND')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error('[Middleware] Error fetching user:', userError.message)
    } else if (user) {
      // Assuming role is stored in user_metadata or app_metadata
      // Adjust 'user_metadata' or 'app_metadata' and the role property name if different
      userRole = user.user_metadata?.role || user.app_metadata?.role
      console.log(`[Middleware] User role: ${userRole}`)
    } else {
      console.log('[Middleware] No user object despite session.')
    }
  } else {
    console.log('[Middleware] Session NOT FOUND')
  }

  const { pathname } = request.nextUrl

  // Define protected and public paths
  const protectedPaths = ['/dashboard']
  const adminPaths = ['/admin']
  const publicAuthPaths = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ]

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))
  const isPublicAuthPath = publicAuthPaths.some((path) =>
    pathname.startsWith(path)
  )

  console.log(
    `[Middleware] isProtectedRoute: ${isProtectedRoute}, isAdminPath: ${isAdminPath}, isPublicAuthPath: ${isPublicAuthPath}`
  )

  // Rule 1: If trying to access admin path
  if (isAdminPath) {
    if (!session) {
      console.log(
        '[Middleware] No session, admin route. Redirecting to /signin with type=admin.'
      )
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('redirectedFrom', pathname)
      url.searchParams.set('type', 'admin')
      return NextResponse.redirect(url)
    }
    // Assuming 'admin' is the role string for administrators
    if (userRole !== 'admin') {
      console.log(
        `[Middleware] Session found, but user role is "${userRole}", not "admin". Redirecting to /dashboard.`
      )
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard' // Or perhaps a dedicated 'unauthorized' page
      return NextResponse.redirect(url)
    }
    // If session exists and role is admin, allow access
    console.log('[Middleware] Admin access GRANTED.')
    return response
  }

  // Rule 2: If trying to access other protected paths (e.g., /dashboard)
  if (!session && isProtectedRoute) {
    console.log(
      '[Middleware] No session, protected route. Redirecting to /signin.'
    )
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Rule 3: If session exists and trying to access public auth pages
  if (session && isPublicAuthPath) {
    console.log(
      '[Middleware] Session found, public auth path. Redirecting to /dashboard.'
    )
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  console.log(
    '[Middleware] Passing through for non-admin, non-protected, or allowed public auth path.'
  )
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

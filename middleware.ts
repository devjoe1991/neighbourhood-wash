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
  let validSession = false
  if (session) {
    console.log('[Middleware] Session FOUND')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error('[Middleware] Error fetching user:', userError.message)
      // Clear invalid session by signing out
      console.log('[Middleware] Clearing invalid session...')
      await supabase.auth.signOut()
      validSession = false
    } else if (user) {
      // Fetch role from profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('[Middleware] Error fetching profile:', profileError.message)
          // Fallback to metadata role
          userRole = user.user_metadata?.selected_role || user.user_metadata?.role || user.app_metadata?.role
        } else {
          userRole = profile?.role
        }
        
        // Fallback to metadata if no profile role
        if (!userRole) {
          userRole = user.user_metadata?.selected_role || user.user_metadata?.role || user.app_metadata?.role
        }
        
        console.log(`[Middleware] User role: ${userRole}`)
        validSession = true
      } catch (error) {
        console.error('[Middleware] Exception fetching profile:', error)
        userRole = user.user_metadata?.selected_role || user.user_metadata?.role || user.app_metadata?.role
        console.log(`[Middleware] Fallback user role: ${userRole}`)
        validSession = true
      }
    } else {
      console.log('[Middleware] No user object despite session.')
      // Clear invalid session
      await supabase.auth.signOut()
      validSession = false
    }
  } else {
    console.log('[Middleware] Session NOT FOUND')
    validSession = false
  }

  const { pathname } = request.nextUrl

  // Define protected and public paths
  const protectedPaths = ['/user/dashboard', '/washer/dashboard']
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

  // New Rule: If user is logged in and accessing their own dashboard area, allow them.
  // Also redirect users to their appropriate dashboard if they're in the wrong area.
  if (validSession) {
    if (pathname.startsWith('/admin') && userRole === 'admin') {
      return response // Allow admin in admin area
    }
    if (pathname.startsWith('/washer') && userRole === 'washer') {
      return response // Allow washer in washer area
    }
    if (pathname.startsWith('/user') && (userRole === 'user' || !userRole)) {
      return response // Allow user in user area
    }
    
    // Redirect users to their appropriate dashboard if they're in the wrong area
    if (pathname.startsWith('/user') && userRole === 'washer') {
      console.log('[Middleware] Washer accessing user area, redirecting to washer dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/washer/dashboard'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/washer') && userRole === 'user') {
      console.log('[Middleware] User accessing washer area, redirecting to user dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/user/dashboard'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      console.log('[Middleware] Non-admin accessing admin area, redirecting to appropriate dashboard')
      const url = request.nextUrl.clone()
      if (userRole === 'washer') {
        url.pathname = '/washer/dashboard'
      } else {
        url.pathname = '/user/dashboard'
      }
      return NextResponse.redirect(url)
    }
  }

  console.log(
    `[Middleware] isProtectedRoute: ${isProtectedRoute}, isAdminPath: ${isAdminPath}, isPublicAuthPath: ${isPublicAuthPath}`
  )

  // Rule 1: If trying to access admin path
  if (isAdminPath) {
    if (!validSession) {
      console.log(
        '[Middleware] No valid session, admin route. Redirecting to /signin with type=admin.'
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
        `[Middleware] Valid session found, but user role is "${userRole}", not "admin". Redirecting to appropriate dashboard.`
      )
      const url = request.nextUrl.clone()
      // Redirect to appropriate dashboard based on user role
      if (userRole === 'washer') {
        url.pathname = '/washer/dashboard'
      } else {
        url.pathname = '/user/dashboard'
      }
      return NextResponse.redirect(url)
    }
    // If valid session exists and role is admin, allow access
    console.log('[Middleware] Admin access GRANTED.')
    return response
  }

  // Rule 2: If trying to access other protected paths (e.g., /dashboard)
  if (!validSession && isProtectedRoute) {
    console.log(
      '[Middleware] No valid session, protected route. Redirecting to /signin.'
    )
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Rule 3: If valid session exists and trying to access public auth pages
  if (validSession && isPublicAuthPath) {
    console.log(
      '[Middleware] Valid session found, public auth path. Redirecting to appropriate dashboard.'
    )
    const url = request.nextUrl.clone()
    // Redirect to appropriate dashboard based on user role
    if (userRole === 'admin') {
      url.pathname = '/admin/dashboard'
    } else if (userRole === 'washer') {
      url.pathname = '/washer/dashboard'
    } else {
      url.pathname = '/user/dashboard'
    }
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

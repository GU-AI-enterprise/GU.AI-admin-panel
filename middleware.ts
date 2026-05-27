import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Tạo admin client để bypass RLS khi kiểm tra role
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : null

  // Protected routes - require authentication and admin role
  const protectedPaths = ['/dashboard', '/users', '/settings', '/reports']
  const isProtectedRoute = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Auth routes - redirect if already authenticated
  const authPaths = ['/login']
  const isAuthRoute = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute) {
    if (!session) {
      // Redirect to login if trying to access protected route without session
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin - dùng admin client để bypass RLS
    const adminClient = supabaseAdmin || supabase
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin') {
      // Log chi tiết để debug
      console.error('[Middleware] Admin check failed:', {
        userId: session.user.id,
        userError: userError?.message,
        userErrorDetails: userError,
        hasUserData: !!userData,
        userRole: userData?.role,
        path: request.nextUrl.pathname
      })
      // Redirect to login if not admin
      return NextResponse.redirect(new URL('/login?error=not_admin', request.url))
    }
  }

  if (isAuthRoute && session) {
    // Check if user is admin before redirecting to dashboard - dùng admin client
    const adminClient = supabaseAdmin || supabase
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userError && userData && userData.role === 'admin') {
      // Redirect to dashboard if admin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './src/lib/auth'
import { canAccessAdminPanel } from './src/lib/rbac'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const pathname = request.nextUrl.pathname

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/admin/login']
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if trying to access admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    const payload = verifyToken(token)
    if (!payload || !canAccessAdminPanel(payload)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Check if trying to access user routes
  if (pathname.startsWith('/profile') || pathname.startsWith('/notes')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/notes/:path*', '/login', '/admin/login']
}

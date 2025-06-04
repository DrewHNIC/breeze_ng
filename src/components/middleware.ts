// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  if (!session) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // For customer routes, check if the user has the customer role
  if (req.nextUrl.pathname.startsWith('/customer')) {
    // You can implement role-based checks here if needed
    // For now, we'll just check if they're authenticated
  }

  return res
}

export const config = {
  matcher: ['/customer/:path*'],
}
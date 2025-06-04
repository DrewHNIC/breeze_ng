// pages/api/_middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  // Bypass authentication for specific routes
  const openRoutes = ["/api/payments/webhook"]

  if (openRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and route requires authentication
    if (!session && req.nextUrl.pathname.startsWith("/api/")) {
      console.warn(`🚨 Unauthorized API access attempt: ${req.nextUrl.pathname}`)
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    return res
  } catch (error) {
    console.error("🚨 Middleware error:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export const config = {
  matcher: ["/api/:path*"],
}

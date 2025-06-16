"use client"

import type React from "react"
import { type ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "../utils/supabase"
import { checkAndUpdateExpiredAds } from "./utils/adExpiration"
import {
  LayoutGrid,
  UtensilsCrossed,
  ClipboardList,
  UserCircle,
  Megaphone,
  LogOut,
  Search,
  Menu,
  X,
} from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
}

interface VendorProfile {
  id: string
  store_name: string
  logo_url: string | null
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const router = useRouter()
  const currentPath = router.pathname
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [vendorInitials, setVendorInitials] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Route change loading effect
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  }, [router])

  // Check and update expired ads periodically
  useEffect(() => {
    async function checkExpiredAds() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        await checkAndUpdateExpiredAds(session.user.id)
      } catch (error) {
        console.error("Error checking expired ads:", error)
      }
    }

    checkExpiredAds()
    const interval = setInterval(checkExpiredAds, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Fetch vendor profile and initials
  useEffect(() => {
    async function fetchVendorProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("store_name")
          .eq("id", session.user.id)
          .single()

        if (vendorError) {
          console.error("Error fetching vendor data:", vendorError)
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from("vendor_profiles")
          .select("id, logo_url")
          .eq("vendor_id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching vendor profile:", profileError)
        }

        const profile = {
          id: session.user.id,
          store_name: vendorData.store_name,
          logo_url: profileData?.logo_url || null,
        }

        setVendorProfile(profile)

        if (vendorData.store_name) {
          const words = vendorData.store_name.split(" ")
          const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : vendorData.store_name.substring(0, 2)
          setVendorInitials(initials.toUpperCase())
        } else {
          setVendorInitials("VD")
        }
      } catch (error) {
        console.error("Error in fetchVendorProfile:", error)
      }
    }

    fetchVendorProfile()
  }, [])

  // Fetch pending orders count and subscribe for updates
  useEffect(() => {
    async function fetchPendingOrdersCount() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("vendor_id", session.user.id)
          .in("status", ["pending", "confirmed"])

        if (error) {
          console.error("Error fetching pending orders count:", error)
          return
        }

        setPendingOrdersCount(data.length)
      } catch (error) {
        console.error("Error in fetchPendingOrdersCount:", error)
      }
    }

    fetchPendingOrdersCount()

    const setupSubscription = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return null

        const vendorId = session.user.id

        const subscription = supabase
          .channel("orders-count-channel")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "orders",
              filter: `vendor_id=eq.${vendorId}`,
            },
            () => {
              fetchPendingOrdersCount()
            },
          )
          .subscribe()

        return subscription
      } catch (error) {
        console.error("Error setting up subscription:", error)
        return null
      }
    }

    let subscription: any

    setupSubscription().then((sub) => {
      subscription = sub
    })

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const menuItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/vendor/menu", label: "Menu Management", icon: UtensilsCrossed },
    {
      href: "/vendor/orders",
      label: "Order Management",
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { href: "/vendor/profile", label: "Profile", icon: UserCircle },
    { href: "/vendor/ads", label: "Advertisements", icon: Megaphone },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      <Head>
        <title>{title} - BREEZE Vendor Dashboard</title>
        <meta name="description" content={`BREEZE Vendor ${title} Dashboard`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen bg-gradient-to-br from-[#1d2c36] to-[#243642] text-[#8f8578] overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#1d2c36] bg-opacity-70 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1d2c36] to-[#243642] border-r border-[#b9c6c8]/20
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
            md:translate-x-0 md:static md:flex-shrink-0
          `}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-[#b9c6c8]/20 md:hidden">
              <h1 className="text-2xl font-bold font-logo bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] bg-clip-text text-transparent">
                BREEZE
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="text-[#8f8578] hover:text-[#b9c6c8] transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 hidden md:block">
              <h1 className="text-2xl font-bold font-logo bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] bg-clip-text text-transparent">
                BREEZE
              </h1>
            </div>
            <nav className="mt-6 flex-1 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#b9c6c8]/20 to-[#b9c6c8]/10 text-[#b9c6c8] border-r-2 border-[#b9c6c8] relative overflow-hidden"
                        : "text-[#8f8578] hover:text-[#b9c6c8] hover:bg-gradient-to-r hover:from-[#b9c6c8]/10 hover:to-transparent"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-[#b9c6c8]/10 to-transparent animate-pulse"></span>
                    )}
                    <Icon className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] text-xs font-bold px-2 py-1 rounded-full relative z-10">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  handleSignOut()
                  setSidebarOpen(false)
                }}
                className="flex items-center gap-3 px-6 py-3 text-sm text-[#8f8578] hover:text-[#b9c6c8] hover:bg-gradient-to-r hover:from-[#b9c6c8]/10 hover:to-transparent w-full transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
          {/* Top Navigation */}
          <header className="bg-gradient-to-r from-[#1d2c36] to-[#243642] border-b border-[#b9c6c8]/20 flex items-center justify-between px-4 py-3 md:px-6 backdrop-blur-sm">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="text-[#8f8578] hover:text-[#b9c6c8] md:hidden transition-colors"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-xl font-semibold text-[#b9c6c8] flex-1 text-center md:text-left">{title}</h2>

            <div className="flex items-center gap-4 ml-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#8f8578] placeholder-[#8f8578]/60 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 w-48 max-w-xs border border-[#b9c6c8]/20"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8f8578]/60" />
              </div>
              <button className="p-2 text-[#8f8578] hover:text-[#b9c6c8] hidden sm:block transition-colors">
                <span className="sr-only">Notifications</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
            </div>
          </header>

          {/* Loading Bar */}
          {isLoading && <div className="h-1 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] animate-pulse w-full" />}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#1d2c36] to-[#243642]">{children}</main>
        </div>
      </div>
    </>
  )
}

export default DashboardLayout

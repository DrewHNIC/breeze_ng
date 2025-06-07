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
import Image from "next/image"

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

  // Loading state on route changes
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

  // Expired ads check
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

  // Fetch vendor profile (store name + logo)
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
          const initials =
            words.length > 1
              ? `${words[0][0]}${words[1][0]}`
              : vendorData.store_name.substring(0, 2)
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

  // Fetch pending orders count and setup subscription
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

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <Head>
        <title>{title} - BREEZE Vendor Dashboard</title>
        <meta name="description" content={`BREEZE Vendor ${title} Dashboard`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="bg-primary border-b border-white flex items-center justify-between px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-white hover:text-accent focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">BREEZE</h1>

          <div className="flex items-center gap-3">
            {/* Search icon toggles search input on mobile */}
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="text-white hover:text-accent focus:outline-none"
            >
              <Search className="w-5 h-5" />
            </button>
            {vendorProfile?.logo_url ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-700">
                <Image
                  src={vendorProfile.logo_url || "/placeholder.svg"}
                  alt={`${vendorProfile.store_name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative w-8 h-8 rounded-full bg-gray-800 text-secondary flex items-center justify-center">
                <span className="text-sm font-medium">{vendorInitials}</span>
              </div>
            )}
          </div>
        </header>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-primary border-r border-black-800 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex-shrink-0`}
        >
          <div className="flex items-center justify-between p-6 border-b border-black-800">
            <h1 className="text-2xl font-bold">BREEZE</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="text-white hover:text-accent focus:outline-none md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-red-900 text-white relative overflow-hidden"
                        : "text-white hover:text-accent hover:bg-red-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-accent opacity-20 animate-pulse"></span>
                    )}
                    <Icon className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-black text-primary text-xs font-bold px-2 py-1 rounded-full relative z-10">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <button
              onClick={() => {
                handleSignOut()
                setSidebarOpen(false)
              }}
              className="flex items-center gap-3 px-6 py-3 text-sm text-secondary hover:text-accent hover:bg-red-900 w-full mt-auto"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation (desktop) */}
          <header className="hidden md:flex bg-primary border-b border-white px-6 py-4 items-center justify-between">
            <h2 className="text-xl font-semibold text-white truncate">{title}</h2>
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex-grow max-w-xs">
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-black text-white rounded-full py-2 px-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-accent truncate"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
              </div>
              {vendorProfile?.logo_url ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-700">
                  <Image
                    src={vendorProfile.logo_url || "/placeholder.svg"}
                    alt={`${vendorProfile.store_name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-10 h-10 rounded-full bg-gray-800 text-secondary flex items-center justify-center">
                  <span className="text-lg font-semibold">{vendorInitials}</span>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-primary p-6 md:p-8">{children}</main>
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-accent"></div>
          </div>
        )}
      </div>
    </>
  )
}

export default DashboardLayout

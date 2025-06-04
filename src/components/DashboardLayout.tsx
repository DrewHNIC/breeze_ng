import type React from "react"
import { type ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "../utils/supabase"
import { checkAndUpdateExpiredAds } from "./utils/adExpiration";
import {
  LayoutGrid,
  UtensilsCrossed,
  ClipboardList,
  UserCircle,
  Megaphone,
  LogOut,
  Search,
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

  useEffect(() => {
  async function checkExpiredAds() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Check and update expired ads
      await checkAndUpdateExpiredAds(session.user.id);
    } catch (error) {
      console.error("Error checking expired ads:", error);
    }
  }

  checkExpiredAds();
  
  // Run this check every 5 minutes while the dashboard is open
  const interval = setInterval(checkExpiredAds, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    async function fetchVendorProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        // First get the vendor data to ensure we have the store name
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("store_name")
          .eq("id", session.user.id)
          .single()

        if (vendorError) {
          console.error("Error fetching vendor data:", vendorError)
          return
        }

        // Get the vendor profile which contains the logo
        const { data: profileData, error: profileError } = await supabase
          .from("vendor_profiles")
          .select("id, logo_url")
          .eq("vendor_id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          // Not found is ok
          console.error("Error fetching vendor profile:", profileError)
        }

        // Combine the data
        const profile = {
          id: session.user.id,
          store_name: vendorData.store_name,
          logo_url: profileData?.logo_url || null,
        }

        setVendorProfile(profile)

        // Generate initials from store name as fallback
        if (vendorData.store_name) {
          const words = vendorData.store_name.split(" ")
          const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : vendorData.store_name.substring(0, 2)
          setVendorInitials(initials.toUpperCase())
        } else {
          setVendorInitials("VD") // Default: Vendor Dashboard
        }
      } catch (error) {
        console.error("Error in fetchVendorProfile:", error)
      }
    }

    fetchVendorProfile()
  }, [])

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

    // Fix: Correctly handle subscription setup and cleanup
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
      <div className="flex h-screen bg-black text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-primary border-r border-black-800">
          <div className="p-6">
            <h1 className="text-2xl font-bold">BREEZE</h1>
          </div>
          <nav className="mt-6">
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
                >
                  {isActive && <span className="absolute inset-0 bg-accent opacity-20 animate-pulse"></span>}
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-6 py-3 text-sm text-secondary hover:text-accent hover:bg-red-900 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="bg-primary border-b border-white">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-black text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-accent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
                </div>
                <button className="p-2 text-white hover:text-accent">
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

                {/* Profile Image/Avatar - Updated to show logo when available */}
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
                  <button className="relative w-8 h-8 rounded-full bg-gray-800 text-secondary flex items-center justify-center">
                    <span className="text-sm font-medium">{vendorInitials}</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-primary p-6 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                <p className="text-white text-xl font-bold italic">Loading...</p>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default DashboardLayout


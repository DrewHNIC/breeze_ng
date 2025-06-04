import { ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"; 
import { Home, Search, ShoppingCart, Clock, User, Settings, LogOut, Heart, MenuIcon, X } from 'lucide-react'
import Image from "next/image"

interface CustomerLayoutProps {
  children: ReactNode
  title: string
}

interface CustomerProfile {
  id: string
  name: string
  avatar_url: string | null
}

const CustomerLayout = ({ children, title }: CustomerLayoutProps) => {
  const router = useRouter()
  const currentPath = router.pathname
  const [isLoading, setIsLoading] = useState(false)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [customerInitials, setCustomerInitials] = useState("")

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
    async function fetchCustomerProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, avatar_url")
          .eq("id", session.user.id)
          .single()

        if (customerError) {
          console.error("Error fetching customer data:", customerError)
          return
        }

        setCustomerProfile(customerData)

        // Generate initials from name as fallback
        if (customerData.name) {
          const words = customerData.name.split(" ")
          const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : customerData.name.substring(0, 2)
          setCustomerInitials(initials.toUpperCase())
        } else {
          setCustomerInitials("CU") // Default: Customer
        }
      } catch (error) {
        console.error("Error in fetchCustomerProfile:", error)
      }
    }

    fetchCustomerProfile()
  }, [])

  useEffect(() => {
    async function fetchCartItems() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from("cart_items")
          .select("id", { count: "exact" })
          .eq("customer_id", session.user.id)

        if (error) {
          console.error("Error fetching cart items:", error)
          return
        }

        setCartItemsCount(data.length)
      } catch (error) {
        console.error("Error in fetchCartItems:", error)
      }
    }

    fetchCartItems()

    // Set up subscription for cart updates
    const setupSubscription = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return null

        const customerId = session.user.id

        const subscription = supabase
          .channel("cart-items-channel")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `customer_id=eq.${customerId}`,
            },
            () => {
              fetchCartItems()
            }
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
    { href: "/customer/dashboard", label: "Home", icon: Home },
    { href: "/customer/search", label: "Search", icon: Search },
    {
      href: "/customer/cart",
      label: "Cart",
      icon: ShoppingCart,
      badge: cartItemsCount > 0 ? cartItemsCount : undefined,
    },
    { href: "/customer/orders", label: "Orders", icon: Clock },
    { href: "/customer/favorites", label: "Favorites", icon: Heart },
    { href: "/customer/profile", label: "Profile", icon: User },
    { href: "/customer/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      <Head>
        <title>{title} - BREEZE</title>
        <meta name="description" content={`BREEZE Customer ${title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/customer/dashboard" className="text-2xl font-bold text-black mr-8">
                BREEZE
              </Link>
              <div className="hidden md:flex space-x-6">
                {menuItems.slice(0, 4).map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1 text-sm ${
                        isActive ? "text-black font-semibold" : "text-gray-600 hover:text-black"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-1 bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block relative">
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  className="bg-gray-100 text-gray-800 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                {customerProfile?.avatar_url ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer">
                    <Image
                      src={customerProfile.avatar_url || "/placeholder.svg"}
                      alt={`${customerProfile.name} avatar`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <button className="relative w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                    <span className="text-sm font-medium">{customerInitials}</span>
                  </button>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-600 hover:text-black"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-2">
              <div className="container mx-auto px-4">
                <div className="flex flex-col space-y-3">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPath === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 py-2 px-3 rounded-md ${
                          isActive ? "bg-gray-100 text-black font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 py-2 px-3 rounded-md text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
              <p className="text-black text-xl font-bold italic">Loading...</p>
            </div>
          )}
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600">© 2025 BREEZE. All rights reserved.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="/about" className="text-sm text-gray-600 hover:text-black">
                  About Us
                </Link>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-black">
                  Contact
                </Link>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-black">
                  Terms
                </Link>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-black">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default CustomerLayout
// components/CustomerLayout.tsx
"use client"

import { type ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  FileText,
  Heart,
  Menu,
  Home,
  X,
} from "lucide-react"
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

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, title }) => {
  const router = useRouter()
  const currentPath = router.pathname
  const [isLoading, setIsLoading] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null)
  const [customerInitials, setCustomerInitials] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: profileData, error: profileError } = await supabase
          .from("customers")
          .select("id, name, avatar_url")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching customer profile:", profileError)
          return
        }

        setCustomerProfile(profileData)

        if (profileData.name) {
          const words = profileData.name.split(" ")
          const initials =
            words.length > 1
              ? `${words[0][0]}${words[1][0]}`
              : profileData.name.substring(0, 2)
          setCustomerInitials(initials.toUpperCase())
        } else {
          setCustomerInitials("CU")
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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from("cart_items")
          .select("id", { count: "exact" })
          .eq("user_id", session.user.id)

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
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/customer/home", label: "Home", icon: Home },
    { href: "/customer/search", label: "Search", icon: Search },
    { href: "/customer/orders", label: "My Orders", icon: FileText },
    { href: "/customer/profile", label: "Profile", icon: User },
    {
      href: "/customer/cart",
      label: "Cart",
      icon: ShoppingCart,
      badge: cartItemsCount > 0 ? cartItemsCount : undefined,
    },
    { href: "/customer/loyalty-program", label: "Loyalty Program", icon: Heart },
  ]

  return (
    <>
      <Head>
        <title>{title} - BREEZE Food Delivery</title>
        <meta name="description" content={`BREEZE Food Delivery - ${title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen bg-white">
        {/* Navigation Bar */}
        <header className="bg-black text-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/customer/home" className="flex items-center">
                <span className="text-2xl font-bold text-white">BREEZE</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center text-sm font-medium transition-colors hover:text-red-900 ${
                        currentPath === item.href ? "text-red-900" : "text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-1" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm font-medium text-white hover:text-red-900 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-white hover:text-red-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Profile Avatar (Mobile Only) */}
              <div className="md:hidden ml-2">
                {customerProfile?.avatar_url ? (
                  <Image
                    src={customerProfile.avatar_url || "/placeholder.svg"}
                    alt={`${customerProfile.name} avatar`}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <span className="text-sm font-medium">{customerInitials}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-black text-white shadow-lg z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700">
                <span className="text-xl font-bold">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:text-red-900"
                  aria-label="Close mobile menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <ul className="flex-grow overflow-y-auto px-4 py-6 space-y-4">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center text-lg font-medium transition-colors hover:text-red-900 ${
                        currentPath === item.href ? "text-red-900" : "text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}

                <li>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    className="flex items-center text-lg font-medium w-full text-left hover:text-red-900 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>

              <div className="px-4 py-4 border-t border-gray-700 flex items-center space-x-3">
                {customerProfile?.avatar_url ? (
                  <Image
                    src={customerProfile.avatar_url || "/placeholder.svg"}
                    alt={`${customerProfile.name} avatar`}
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-semibold">
                    {customerInitials}
                  </div>
                )}
                <span className="text-white font-semibold truncate">
                  {customerProfile?.name || "Customer"}
                </span>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Loading Bar */}
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-red-600 animate-pulse z-50"></div>
        )}

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-black text-white text-center py-4 mt-auto">
          &copy; {new Date().getFullYear()} BREEZE Food Delivery
        </footer>
      </div>
    </>
  )
}

export default CustomerLayout

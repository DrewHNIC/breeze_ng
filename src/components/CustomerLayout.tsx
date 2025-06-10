// components/CustomerLayout.tsx
"use client"

import { type ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, ShoppingCart, User, LogOut,
  FileText, Heart, Menu, Home, X,
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profileData } = await supabase
        .from("customers")
        .select("id, name, avatar_url")
        .eq("id", session.user.id)
        .single()

      setCustomerProfile(profileData)

      const initials = profileData?.name?.split(" ")?.map(n => n[0]).join("").substring(0, 2) || "CU"
      setCustomerInitials(initials.toUpperCase())
    }

    fetchCustomerProfile()
  }, [])

  useEffect(() => {
    async function fetchCartItems() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from("cart_items")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id)

      setCartItemsCount(data?.length || 0)
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

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#1A2026] to-[#1A1A1A] text-[#872816]">
        <header className="bg-[#1A2026] shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/customer/home" className="text-2xl font-bold">
                BREEZE
              </Link>
              <div className="md:hidden ml-2">
                {customerProfile?.avatar_url ? (
                  <Image
                    src={customerProfile.avatar_url || "/placeholder.svg"}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-full border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#C4710B] flex items-center justify-center text-white font-semibold">
                    {customerInitials}
                  </div>
                )}
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <motion.div key={item.href} whileHover={{ scale: 1.1 }}>
                    <Link
                      href={item.href}
                      className={`flex items-center text-sm font-medium transition-colors ${
                        currentPath === item.href ? "text-[#C4710B]" : "text-[#872816]"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-1" />
                      {item.label}
                      {item.badge && (
                        <span className="ml-1 bg-[#C4710B] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm font-medium hover:text-[#C4710B] transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </nav>
              <button
                className="md:hidden ml-auto p-2 hover:text-[#C4710B]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-[#1A2026] shadow-lg z-50 text-[#872816]"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700">
                <span className="text-xl font-bold">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:text-[#C4710B]"
                  aria-label="Close mobile menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <ul className="px-4 py-6 space-y-4">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center text-lg font-medium transition-colors ${
                        currentPath === item.href ? "text-[#C4710B]" : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 bg-[#C4710B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                    className="flex items-center text-lg font-medium w-full text-left hover:text-[#C4710B]"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </li>
              </ul>
              <div className="px-4 py-4 border-t border-gray-700 flex items-center space-x-3">
                {customerProfile?.avatar_url ? (
                  <Image
                    src={customerProfile.avatar_url}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#C4710B] text-white flex items-center justify-center text-lg font-semibold">
                    {customerInitials}
                  </div>
                )}
                <span className="font-semibold truncate">
                  {customerProfile?.name || "Customer"}
                </span>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-[#C4710B] animate-pulse z-50" />
        )}

        <main className="flex-grow container mx-auto px-4 py-4">{children}</main>

        <footer className="bg-[#1A2026] text-[#872816] text-center py-4 mt-auto">
          &copy; {new Date().getFullYear()} BREEZE Food Delivery
        </footer>
      </div>
    </>
  )
}

export default CustomerLayout

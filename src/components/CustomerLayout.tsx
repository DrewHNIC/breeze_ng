// components/CustomerLayout.tsx
"use client"

import { type ReactNode, useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingCart, User, LogOut, Clock, Heart, Settings, Menu, Home, FileText } from 'lucide-react'
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

        // Changed from "profiles" to "customers" table
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
          const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : profileData.name.substring(0, 2)
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
          .eq("user_id", session.user.id) // Make sure this matches your table column name

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
    { href: "/customer/cart", label: "Cart", icon: ShoppingCart, badge: cartItemsCount > 0 ? cartItemsCount : undefined },
    { href: "/customer/loyalty-program", label: "Loyalty Program", icon: Heart },
    // { href: "/customer/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      <Head>
        <title>{title} - BREEZE Food Delivery</title>
        <meta name="description" content={`BREEZE Food Delivery - ${title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex flex-col min-h-screen bg-white">
        {/* 🔥 Navigation Bar (Inspired by PlayStation) */}
        <header className="bg-black text-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              
              {/* 🔹 Logo */}
              <Link href="/customer/home" className="flex items-center">
                <span className="text-2xl font-bold text-white">BREEZE</span>
              </Link>

              {/* 🔹 Desktop Navigation */}
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

                {/* 🔹 Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm font-medium text-white hover:text-red-900 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </button>
              </nav>

              {/* 🔹 Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-white hover:text-red-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* 🔹 Profile Avatar (Mobile Only) */}
              <div className="md:hidden">
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

        {/* 🔥 Main Content */}
        <main className="flex-1 relative">{isLoading ? <p></p> : children}</main>

        {/* 🔥 Footer */}
        <footer className="bg-black text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">BREEZE</h3>
                <p className="text-sm text-gray-300">
                  From your favorite restaurants right to your doorstep.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about-us" className="text-sm text-gray-300 hover:text-red-900 transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm text-gray-300 hover:text-red-900 transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-gray-300 hover:text-red-900 transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/terms-of-service" className="text-sm text-gray-300 hover:text-red-900 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-sm text-gray-300 hover:text-red-900 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-800 text-center">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} BREEZE. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default CustomerLayout
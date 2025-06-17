"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Head from "next/head"
import { supabase } from "@/utils/supabase"
import { Home, Package, Clock, User, LogOut, Menu, X, DollarSign, Bike } from "lucide-react"
import { NotificationProvider } from "@/components/ui/notifications"

interface RiderLayoutProps {
  children: React.ReactNode
  title?: string
}

const RiderLayout = ({ children, title = "Rider Dashboard" }: RiderLayoutProps) => {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push("/login")
    }

    // Check if user is a rider
    if (session) {
      const { data, error } = await supabase.from("riders").select("id").eq("id", session.user.id).single()

      if (error || !data) {
        router.push("/login")
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Only render the layout when mounted to avoid hydration errors
  if (!isMounted) {
    return null
  }

  const navigation = [
    { name: "Home", href: "/rider/home", icon: Home },
    { name: "Available Orders", href: "/rider/available-orders", icon: Package },
    { name: "Current Delivery", href: "/rider/current-delivery", icon: Bike },
    { name: "Delivery History", href: "/rider/delivery-history", icon: Clock },
    { name: "Earnings", href: "/rider/earnings", icon: DollarSign },
    { name: "Profile", href: "/rider/profile", icon: User },
  ]

  return (
    <NotificationProvider>
      <Head>
        <title>{title} | Breeze Delivery</title>
      </Head>

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
        {/* Top Navigation */}
        <header className="bg-gradient-to-r from-[#1d2c36] to-[#2a3f4a] shadow-lg sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                className="p-2 rounded-md hover:bg-[#b9c6c8]/20 md:hidden text-[#8f8578]"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold font-logo text-[#8f8578] ml-2">Breeze</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 ${
                    router.pathname === item.href
                      ? "bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] shadow-md"
                      : "text-[#8f8578] hover:text-[#b9c6c8] hover:bg-[#b9c6c8]/10"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}

              {/* Desktop Logout Button */}
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center text-[#8f8578] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 ml-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Side Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="bg-gradient-to-b from-[#8f8578] to-[#7a7066] w-64 h-full shadow-2xl">
              <div className="p-4 border-b border-[#b9c6c8]/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold font-logo text-lg text-[#1d2c36]">Breeze</h2>
                  <button
                    className="p-2 rounded-full hover:bg-[#b9c6c8]/20 text-[#1d2c36]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          router.pathname === item.href
                            ? "bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] shadow-md"
                            : "text-[#1d2c36] hover:bg-[#b9c6c8]/20"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t border-[#b9c6c8]/30">
                <button
                  className="flex items-center px-4 py-3 rounded-lg w-full text-left text-red-600 hover:bg-red-50/20 transition-all duration-200"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </NotificationProvider>
  )
}

export default RiderLayout

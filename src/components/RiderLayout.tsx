// components/RiderLayout.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Head from "next/head"
import { supabase } from "@/utils/supabase"
import { Home, Package, Clock, User, LogOut, Menu, X, DollarSign, Bike } from 'lucide-react'

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
      const { data, error } = await supabase
        .from("riders")
        .select("id")
        .eq("id", session.user.id)
        .single()
      
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
    <>
      <Head>
        <title>{title} | Breeze Delivery</title>
      </Head>

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {isMenuOpen ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
                  <div className="bg-white w-64 h-full p-0">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg">Breeze Delivery</h2>
                        <button 
                          className="p-2 rounded-full hover:bg-gray-100"
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
                              className={`flex items-center px-4 py-2 rounded-md ${
                                router.pathname === item.href
                                  ? "bg-red-50 text-red-600"
                                  : "text-gray-600 hover:bg-gray-100"
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
                    <div className="p-4 border-t">
                      <button
                        className="flex items-center px-4 py-2 rounded-md w-full text-left text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="p-2 rounded-md hover:bg-gray-100 md:hidden"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-900 ml-2">Breeze Rider</h1>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    router.pathname === item.href
                      ? "text-red-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden bg-white border-t fixed bottom-0 left-0 right-0 z-10">
          <div className="grid grid-cols-5 h-16">
            {navigation.slice(0, 5).map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`h-full w-full flex flex-col items-center justify-center ${
                  router.pathname === item.href
                    ? "text-red-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Add padding at the bottom for mobile to account for the fixed navigation */}
        <div className="h-16 md:hidden" />
      </div>
    </>
  )
}

export default RiderLayout
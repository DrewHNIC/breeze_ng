"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import type { Advertisement } from "@/types/advertisement"
import { CheckCircle, Loader, Star, Rocket } from "lucide-react"
import { useRouter } from "next/router"

// Define Available Advertisement Packages
const adPackages = [
  {
    name: "Basic Boost",
    price: 2400,
    description: "Perfect for new stores looking to gain visibility.",
    features: ["Appears in recommended listings", "Slight priority in search results", "Basic analytics dashboard"],
  },
  {
    name: "Visibility Plus",
    price: 3000,
    description: "Enhance your store visibility with premium placements.",
    features: [
      "Store gets a 'Sponsored' tag",
      "Higher ranking in search results",
      "Featured on the search page",
      "Detailed performance metrics",
    ],
  },
  {
    name: "Growth Plan",
    price: 3500,
    description: "Scale your business with strategic placements.",
    features: [
      "All Visibility Plus benefits",
      "Occasional placement on homepage",
      "Store highlighted in category pages",
      "Weekly performance reports",
    ],
    highlight: true,
  },
  {
    name: "Premium Reach",
    price: 4000,
    description: "Maximize your reach with prime positioning.",
    features: [
      "All Growth Plan benefits",
      "Store displayed on checkout page",
      "Guaranteed feature in customer search",
      "Priority customer support",
    ],
  },
  {
    name: "Ultimate Expansion",
    price: 5500,
    description: "The best package for ultimate exposure.",
    features: [
      "All Premium Reach benefits",
      "Full banner ads on homepage & search",
      "Email marketing campaign",
      "Dedicated account manager",
      "Advanced performance analytics",
    ],
  },
]

interface AdPackagesProps {
  activeAd: Advertisement | null
  onPurchase: () => void
}

const AdPackages: React.FC<AdPackagesProps> = ({ activeAd, onPurchase }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          setUserId(session.user.id)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      }
    }
    checkAuth()
  }, [router])

  const handlePurchase = async (packageName: string, price: number) => {
    try {
      setIsLoading(true)
      setError(null)
      setSelectedPackage(packageName)

      if (!userId) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName, price, userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      window.location.href = data.data.authorization_url
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to purchase advertisement package")
      setSelectedPackage(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl p-8 text-center border border-[#b9c6c8]/20">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2 text-[#b9c6c8]">
          <Rocket className="w-8 h-8" /> Boost Your Store!
        </h2>
        <p className="text-[#8f8578] max-w-3xl mx-auto mt-2">
          Select an <strong>advertisement package</strong> to <strong>increase visibility</strong> and{" "}
          <strong>attract more customers</strong>.
        </p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">{error}</div>}
      </div>

      {/* Ad Package Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
        {adPackages.map((pkg) => (
          <div
            key={pkg.name}
            className={`relative bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-lg overflow-hidden p-6 border-2 transition-all duration-200 hover:scale-105 ${
              pkg.highlight ? "border-[#b9c6c8]" : "border-[#b9c6c8]/20"
            }`}
          >
            {pkg.highlight && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] px-3 py-1 text-xs font-bold">
                <Star className="w-4 h-4 inline-block mr-1" />
                BEST VALUE
              </div>
            )}

            <h3 className="text-xl font-bold mb-2 text-[#b9c6c8]">{pkg.name}</h3>
            <p className="text-[#8f8578] text-sm mb-4 leading-relaxed">{pkg.description}</p>
            <p className="text-3xl font-bold text-[#b9c6c8] mb-1">₦{pkg.price.toLocaleString()}</p>
            <p className="text-sm text-[#8f8578] mb-4">per day</p>

            <ul className="mb-6 space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-[#8f8578] leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (!activeAd && !isLoading && userId) {
                  handlePurchase(pkg.name, pkg.price)
                } else if (!userId) {
                  router.push("/login")
                }
              }}
              disabled={activeAd !== null || isLoading || selectedPackage === pkg.name}
              className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeAd === null && !isLoading
                  ? "bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] hover:from-[#8f8578] hover:to-[#b9c6c8]"
                  : "bg-[#8f8578]/50 text-[#8f8578] cursor-not-allowed"
              }`}
            >
              {selectedPackage === pkg.name ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </span>
              ) : activeAd === null ? (
                "Purchase"
              ) : (
                "Active Plan"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdPackages

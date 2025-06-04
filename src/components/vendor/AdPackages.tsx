// components/vendor/AdPackages.tsx
import React, { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Advertisement } from "@/types/advertisement"
import { CheckCircle, Loader, Star, ShieldCheck, Rocket } from "lucide-react"
import { useRouter } from "next/router"
import { motion } from "framer-motion"

// 🔥 Define Available Advertisement Packages
const adPackages = [
  {
    name: "Basic Boost",
    price: 2400,
    description: "Perfect for new stores looking to gain visibility.",
    features: [
      "Appears in recommended listings",
      "Slight priority in search results",
      "Basic analytics dashboard",
    ],
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
        const { data: { session } } = await supabase.auth.getSession()
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* 🔥 Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-xl p-8 text-white text-center"
      >
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Rocket className="w-8 h-8" /> Boost Your Store!
        </h2>
        <p className="text-gray-300 max-w-3xl mx-auto mt-2">
          Select an **advertisement package** to **increase visibility** and **attract more customers**.
        </p>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4"
          >
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* 💎 Ad Package Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {adPackages.map((pkg) => (
          <motion.div
            key={pkg.name}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border-2 ${
              pkg.highlight ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {pkg.highlight && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-xs font-bold">
                <Star className="w-4 h-4 inline-block mr-1" />
                BEST VALUE
              </div>
            )}

            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{pkg.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{pkg.description}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">₦{pkg.price.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mb-4">per day</p>

            <ul className="mb-6 space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {feature}
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
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                activeAd === null && !isLoading
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default AdPackages

// components/vendor/AdStatus.tsx
import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { checkAndUpdateExpiredAds } from "../utils/adExpiration"
import { motion } from "framer-motion"
import { Clock, Calendar, Package } from "lucide-react"

interface AdStatusProps {
  vendorId: string
}

const AdStatus = ({ vendorId }: AdStatusProps) => {
  const [activeAds, setActiveAds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActiveAds() {
      setIsLoading(true)

      // Check and update expired ads first
      await checkAndUpdateExpiredAds(vendorId)

      // Fetch active ads only
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, title, start_time, expiry_time, status, package_id, ad_packages(name, price)")
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .gt("expiry_time", new Date().toISOString()) // Ensure ad has not expired
        .order("expiry_time", { ascending: true })

      if (error) {
        console.error("Error fetching active ads:", error)
      } else {
        console.log(`Active ads for vendor ${vendorId}:`, data)
        setActiveAds(data || [])
      }

      setIsLoading(false)
    }

    fetchActiveAds()
  }, [vendorId])

  // 🕒 Function to format remaining time
  const getRemainingTime = (expiryTime: string) => {
    const expiry = new Date(expiryTime)
    const now = new Date()

    const diffMs = expiry.getTime() - now.getTime()
    if (diffMs <= 0) return "Expired"

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m remaining`
  }

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500 animate-pulse">Loading active advertisements...</div>
  }

  if (activeAds.length === 0) {
    return null // Don't show anything if there are no active ads
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6"
    >
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Active Advertisements</h3>

      <div className="space-y-4">
        {activeAds.map((ad) => (
          <motion.div
            key={ad.id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{ad.title}</h4>
              <span className="text-sm font-medium text-red-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" /> {getRemainingTime(ad.expiry_time)}
              </span>
            </div>

            <div className="flex items-center mt-3 space-x-4 text-gray-600 dark:text-gray-400 text-sm">
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-blue-500" />
                <span>Package: {ad.ad_packages?.name || "Standard"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-green-500" />
                <span>Expires: {new Date(ad.expiry_time).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default AdStatus

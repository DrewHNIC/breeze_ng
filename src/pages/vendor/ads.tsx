// pages/vendor/ads.tsx
import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/components/DashboardLayout"
import AdPackages from "@/components/vendor/AdPackages"
import AdStatistics from "@/components/vendor/AdStatistics"
import AdCountdownTimer from "@/components/vendor/AdCountdownTimer"
import TerminateAdModal from "@/components/vendor/TerminateAdModal"
import PaymentHistory from "@/components/vendor/PaymentHistory"
import AuthCheck from "@/components/vendor/AuthCheck"
import { supabase } from "@/utils/supabase"
import { Advertisement } from "@/types/advertisement"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Loader2, Rocket, TrendingUp, Trash2 } from "lucide-react"

const AdvertisementPage: React.FC = () => {
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchActiveAd()
  }, [])

  const fetchActiveAd = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("vendor_id", session.user.id)
        .gte("end_date", new Date().toISOString())
        .order("end_date", { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setActiveAd(data || null)
    } catch (error) {
      console.error("Error fetching active ad:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateAd = async () => {
    if (!activeAd) return

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", activeAd.id)

      if (error) throw error

      setActiveAd(null)
      setIsTerminateModalOpen(false)
    } catch (error) {
      console.error("Error terminating ad campaign:", error)
      alert("Failed to terminate ad campaign. Please try again.")
    }
  }

  return (
    <AuthCheck>
      <DashboardLayout title="Advertisement Management">
        <div className="space-y-8 max-w-7xl mx-auto">

          {/* 🔄 Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin w-12 h-12 text-red-500" />
            </div>
          ) : (
            <>
              {/* 🌟 Banner Section */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-xl p-8 text-white text-center"
              >
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                  <Rocket className="w-8 h-8" /> Boost Your Visibility!
                </h1>
                <p className="text-gray-300 max-w-3xl mx-auto mt-2">
                  Get your store in front of thousands of potential customers with our advertisement packages. 
                  Choose a plan and start attracting more orders today!
                </p>
              </motion.div>

              {/* 🎯 Active Ad Campaign */}
              {activeAd && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-900 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-yellow-400" />
                      Active Campaign: {activeAd.package_name}
                    </h2>
                    <p className="text-gray-400 mt-1">
                      Your campaign is running and will expire on:
                    </p>
                    <AdCountdownTimer endDate={activeAd.end_date} />
                  </div>
                </motion.div>
              )}

              {/* 🛠 Advertisement Tabs */}
              <Tabs defaultValue="packages" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="packages">Advertisement Packages</TabsTrigger>
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                  {activeAd && <TabsTrigger value="statistics">Campaign Statistics</TabsTrigger>}
                </TabsList>

                {/* 📢 Advertisement Packages */}
                <TabsContent value="packages">
                  <AdPackages activeAd={activeAd} onPurchase={fetchActiveAd} />

                  {/* 🔴 Terminate Ad Button */}
                  {activeAd && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 text-center mt-8"
                    >
                      <h3 className="text-xl font-bold mb-4">Want to Change Your Campaign?</h3>
                      <p className="mb-6 text-gray-600 dark:text-gray-300">
                        You can terminate your current campaign to switch to a different package.
                        Please note: <span className="text-red-500 font-semibold">This action is irreversible and non-refundable.</span>
                      </p>
                      <button
                        onClick={() => setIsTerminateModalOpen(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        Terminate Current Campaign
                      </button>
                    </motion.div>
                  )}
                </TabsContent>

                {/* 💳 Payment History */}
                <TabsContent value="payments">
                  <PaymentHistory />
                </TabsContent>

                {/* 📈 Campaign Statistics */}
                {activeAd && (
                  <TabsContent value="statistics">
                    <AdStatistics ad={activeAd} />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}

          {/* 🔥 Termination Confirmation Modal */}
          <TerminateAdModal
            isOpen={isTerminateModalOpen}
            onClose={() => setIsTerminateModalOpen(false)}
            onConfirm={handleTerminateAd}
            packageName={activeAd?.package_name || ""}
          />
        </div>
      </DashboardLayout>
    </AuthCheck>
  )
}

export default AdvertisementPage

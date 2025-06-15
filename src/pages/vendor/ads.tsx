"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/components/DashboardLayout"
import AdPackages from "@/components/vendor/AdPackages"
import AdStatistics from "@/components/vendor/AdStatistics"
import AdCountdownTimer from "@/components/vendor/AdCountdownTimer"
import TerminateAdModal from "@/components/vendor/TerminateAdModal"
import PaymentHistory from "@/components/vendor/PaymentHistory"
import AuthCheck from "@/components/vendor/AuthCheck"
import { supabase } from "@/utils/supabase"
import type { Advertisement } from "@/types/advertisement"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Rocket, TrendingUp, Trash2, CheckCircle, AlertCircle, X } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  timestamp: Date
}

const AdvertisementPage: React.FC = () => {
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  // Add notification function
  const addNotification = (type: Notification["type"], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
    }
    setNotifications((prev) => [notification, ...prev])

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  // Remove notification function
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Rocket className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  // Get notification colors
  const getNotificationColors = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  useEffect(() => {
    fetchActiveAd()
  }, [])

  const fetchActiveAd = async () => {
    try {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
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
      addNotification("error", "Error", "Failed to load advertisement data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateAd = async () => {
    if (!activeAd) return

    try {
      const { error } = await supabase.from("advertisements").delete().eq("id", activeAd.id)

      if (error) throw error

      setActiveAd(null)
      setIsTerminateModalOpen(false)
      addNotification("success", "Campaign Terminated", "Your advertisement campaign has been successfully terminated")
    } catch (error) {
      console.error("Error terminating ad campaign:", error)
      addNotification("error", "Termination Failed", "Failed to terminate ad campaign. Please try again.")
    }
  }

  return (
    <AuthCheck>
      <DashboardLayout title="Advertisement Management">
        <div className="space-y-8 max-w-7xl mx-auto relative">
          {/* Notification Container */}
          {notifications.length > 0 && (
            <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getNotificationColors(
                    notification.type,
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin w-12 h-12 text-[#b9c6c8]" />
            </div>
          ) : (
            <>
              {/* Banner Section */}
              <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl p-8 text-center border border-[#b9c6c8]/20">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-[#b9c6c8]">
                  <Rocket className="w-8 h-8" /> Boost Your Visibility!
                </h1>
                <p className="text-[#8f8578] max-w-3xl mx-auto mt-2">
                  Get your store in front of thousands of potential customers with our advertisement packages. Choose a
                  plan and start attracting more orders today!
                </p>
              </div>

              {/* Active Ad Campaign */}
              {activeAd && (
                <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl overflow-hidden border border-[#b9c6c8]/20">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-[#b9c6c8] flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-[#b9c6c8]" />
                      Active Campaign: {activeAd.package_name}
                    </h2>
                    <p className="text-[#8f8578] mt-1">Your campaign is running and will expire on:</p>
                    <AdCountdownTimer endDate={activeAd.end_date} />
                  </div>
                </div>
              )}

              {/* Advertisement Tabs */}
              <Tabs defaultValue="packages" className="w-full">
                <TabsList className="mb-6 bg-gradient-to-r from-[#1d2c36] to-[#243642] border border-[#b9c6c8]/20">
                  <TabsTrigger
                    value="packages"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#b9c6c8] data-[state=active]:to-[#8f8578] data-[state=active]:text-[#1d2c36] text-[#8f8578]"
                  >
                    Advertisement Packages
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#b9c6c8] data-[state=active]:to-[#8f8578] data-[state=active]:text-[#1d2c36] text-[#8f8578]"
                  >
                    Payment History
                  </TabsTrigger>
                  {activeAd && (
                    <TabsTrigger
                      value="statistics"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#b9c6c8] data-[state=active]:to-[#8f8578] data-[state=active]:text-[#1d2c36] text-[#8f8578]"
                    >
                      Campaign Statistics
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Advertisement Packages */}
                <TabsContent value="packages">
                  <AdPackages activeAd={activeAd} onPurchase={fetchActiveAd} />

                  {/* Terminate Ad Button */}
                  {activeAd && (
                    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl p-6 text-center mt-8 border border-[#b9c6c8]/20">
                      <h3 className="text-xl font-bold mb-4 text-[#b9c6c8]">Want to Change Your Campaign?</h3>
                      <p className="mb-6 text-[#8f8578]">
                        You can terminate your current campaign to switch to a different package. Please note:{" "}
                        <span className="text-red-400 font-semibold">
                          This action is irreversible and non-refundable.
                        </span>
                      </p>
                      <button
                        onClick={() => setIsTerminateModalOpen(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                      >
                        <Trash2 className="w-5 h-5" />
                        Terminate Current Campaign
                      </button>
                    </div>
                  )}
                </TabsContent>

                {/* Payment History */}
                <TabsContent value="payments">
                  <PaymentHistory />
                </TabsContent>

                {/* Campaign Statistics */}
                {activeAd && (
                  <TabsContent value="statistics">
                    <AdStatistics ad={activeAd} />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}

          {/* Termination Confirmation Modal */}
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

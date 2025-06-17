"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import {
  Banknote,
  TrendingUp,
  Calendar,
  Package,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Wallet,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import RiderLayout from "@/components/RiderLayout"

interface EarningsData {
  totalEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
  totalDeliveries: number
  averageEarningsPerDelivery: number
  pendingEarnings: number
  paidEarnings: number
}

interface EarningsHistory {
  id: string
  order_id: string
  amount: number
  status: string
  created_at: string
  order: {
    delivery_address: string
    vendor: {
      store_name: string
    }
  }
}

const EarningsPage = () => {
  const router = useRouter()
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riderId, setRiderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedEarningId, setExpandedEarningId] = useState<string | null>(null)
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; description: string; type: string }>
  >([])

  // Simple notification system for this component
  const addNotification = (notification: { title: string; description: string; type: string }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications((prev) => [...prev, newNotification])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchEarningsData()
      fetchRiderStatus()
    }
  }, [riderId, dateFilter, sortOrder])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Check if user is a rider
      const { data, error } = await supabase.from("riders").select("id").eq("id", session.user.id).single()

      if (error || !data) {
        router.push("/login")
        return
      }

      setRiderId(data.id)
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
    }
  }

  const fetchRiderStatus = async () => {
    if (!riderId) return

    try {
      const { data, error } = await supabase.from("riders").select("is_available").eq("id", riderId).single()

      if (error) {
        console.error("Error fetching rider status:", error)
        return
      }

      setRiderStatus(data.is_available)
    } catch (error) {
      console.error("Error in fetchRiderStatus:", error)
    }
  }

  const toggleRiderStatus = async () => {
    if (!riderId) return

    try {
      const newStatus = !riderStatus

      const { error } = await supabase.from("riders").update({ is_available: newStatus }).eq("id", riderId)

      if (error) {
        console.error("Error updating rider status:", error)
        addNotification({
          title: "Status update failed",
          description: "Could not update your availability status.",
          type: "error",
        })
        return
      }

      setRiderStatus(newStatus)
      setStatusUpdateTime(new Date().toLocaleTimeString())

      addNotification({
        title: "Status updated",
        description: newStatus ? "You are now available for deliveries." : "You are now unavailable for deliveries.",
        type: "success",
      })
    } catch (error) {
      console.error("Error in toggleRiderStatus:", error)
      addNotification({
        title: "An error occurred",
        description: "Failed to update your status.",
        type: "error",
      })
    }
  }

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching earnings data...")

      // Build the query based on date filter
      let query = supabase
        .from("rider_earnings")
        .select(`
          id,
          order_id,
          amount,
          status,
          created_at,
          orders!rider_earnings_order_id_fkey(
            delivery_address,
            vendors!orders_vendor_id_fkey(store_name)
          )
        `)
        .eq("rider_id", riderId)

      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        query = query.gte("created_at", today)
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        query = query.gte("created_at", weekAgo)
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
        query = query.gte("created_at", monthAgo)
      }

      // Apply sort order
      query = query.order("created_at", { ascending: sortOrder === "asc" })

      const { data: earningsHistoryData, error: historyError } = await query

      if (historyError) {
        console.error("Error fetching earnings history:", historyError)
        setError("Failed to load earnings data. Please try again.")
        return
      }

      console.log("Earnings history data:", earningsHistoryData)

      // Process earnings history
      const processedHistory: EarningsHistory[] = earningsHistoryData.map((earning: any) => ({
        id: earning.id,
        order_id: earning.order_id,
        amount: earning.amount,
        status: earning.status,
        created_at: earning.created_at,
        order: {
          delivery_address: earning.orders?.delivery_address || "Unknown Address",
          vendor: {
            store_name: earning.orders?.vendors?.store_name || "Unknown Restaurant",
          },
        },
      }))

      setEarningsHistory(processedHistory)

      // Calculate earnings statistics
      const totalEarnings = processedHistory.reduce((sum, earning) => sum + earning.amount, 0)
      const paidEarnings = processedHistory
        .filter((earning) => earning.status === "paid")
        .reduce((sum, earning) => sum + earning.amount, 0)
      const pendingEarnings = processedHistory
        .filter((earning) => earning.status === "pending")
        .reduce((sum, earning) => sum + earning.amount, 0)

      // Calculate weekly earnings
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      const weeklyEarnings = processedHistory
        .filter((earning) => new Date(earning.created_at) >= weekAgo)
        .reduce((sum, earning) => sum + earning.amount, 0)

      // Calculate monthly earnings
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      const monthlyEarnings = processedHistory
        .filter((earning) => new Date(earning.created_at) >= monthAgo)
        .reduce((sum, earning) => sum + earning.amount, 0)

      const totalDeliveries = processedHistory.length
      const averageEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0

      setEarningsData({
        totalEarnings,
        weeklyEarnings,
        monthlyEarnings,
        totalDeliveries,
        averageEarningsPerDelivery,
        pendingEarnings,
        paidEarnings,
      })
    } catch (error) {
      console.error("Error in fetchEarningsData:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    } catch (e) {
      return dateString
    }
  }

  const toggleEarningExpand = (earningId: string) => {
    if (expandedEarningId === earningId) {
      setExpandedEarningId(null)
    } else {
      setExpandedEarningId(earningId)
    }
  }

  if (isLoading) {
    return (
      <RiderLayout title="Earnings">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Earnings">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Earnings</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchEarningsData()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Try Again
            </Button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  return (
    <RiderLayout title="Earnings">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300 ${
                notification.type === "success"
                  ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                  : notification.type === "error"
                    ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                    : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {notification.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Rider Status Banner */}
        <div
          className={`mb-4 p-4 rounded-lg flex items-center justify-between shadow-md ${
            riderStatus
              ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200"
              : "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
          }`}
        >
          <div className="flex items-center">
            {riderStatus ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            )}
            <div>
              <span className={riderStatus ? "text-green-700" : "text-yellow-700"}>
                {riderStatus
                  ? "You are currently available for deliveries"
                  : "You are currently unavailable for deliveries"}
              </span>
              {statusUpdateTime && <p className="text-xs text-gray-500 mt-0.5">Status updated at {statusUpdateTime}</p>}
            </div>
          </div>
          <Button
            onClick={() => toggleRiderStatus()}
            variant="ghost"
            size="sm"
            className={`${
              riderStatus
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            } transition-all duration-200`}
          >
            {riderStatus ? "Go Offline" : "Go Online"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-[#1d2c36]">Earnings</h1>

        {/* Earnings Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-[#1d2c36]/70 mb-1">Total Earnings</h3>
              <div className="flex items-center">
                <Banknote className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-[#1d2c36]">
                  ₦{earningsData?.totalEarnings.toLocaleString() || "0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-[#1d2c36]/70 mb-1">This Week</h3>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold text-[#1d2c36]">
                  ₦{earningsData?.weeklyEarnings.toLocaleString() || "0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-[#1d2c36]/70 mb-1">This Month</h3>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-2xl font-bold text-[#1d2c36]">
                  ₦{earningsData?.monthlyEarnings.toLocaleString() || "0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-[#1d2c36]/70 mb-1">Avg per Delivery</h3>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-orange-500 mr-2" />
                <span className="text-2xl font-bold text-[#1d2c36]">
                  ₦{Math.round(earningsData?.averageEarningsPerDelivery || 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-green-700 mb-1">Paid Earnings</h3>
              <div className="flex items-center">
                <Wallet className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-800">
                  ₦{earningsData?.paidEarnings.toLocaleString() || "0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm text-yellow-700 mb-1">Pending Earnings</h3>
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-2xl font-bold text-yellow-800">
                  ₦{earningsData?.pendingEarnings.toLocaleString() || "0"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-[#b9c6c8] mr-2" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-[#b9c6c8]/20 text-[#1d2c36] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b9c6c8] border border-[#b9c6c8]/30"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <Button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  variant="outline"
                  size="sm"
                  className="flex items-center bg-[#b9c6c8]/20 text-[#1d2c36] border-[#b9c6c8]/30 hover:bg-[#b9c6c8]/30"
                >
                  {sortOrder === "desc" ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Newest First
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Oldest First
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings History */}
        <Card className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardHeader className="p-6 border-b border-[#b9c6c8]/30">
            <h3 className="font-medium text-[#1d2c36]">Earnings History</h3>
          </CardHeader>
          <CardContent className="p-0">
            {earningsHistory.length > 0 ? (
              <div className="divide-y divide-[#b9c6c8]/20">
                {earningsHistory.map((earning) => (
                  <div key={earning.id}>
                    <div
                      className="p-6 cursor-pointer hover:bg-[#b9c6c8]/10 transition-colors duration-200"
                      onClick={() => toggleEarningExpand(earning.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-[#1d2c36]">{earning.order.vendor.store_name}</h4>
                          <p className="text-sm text-[#1d2c36]/70">Order #{earning.order_id.substring(0, 8)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+₦{earning.amount.toLocaleString()}</p>
                          <p className={`text-xs ${earning.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                            {earning.status === "paid" ? "Paid" : "Pending"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-[#1d2c36]/70">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(earning.created_at)}
                        </div>
                        <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                          {expandedEarningId === earning.id ? (
                            <ChevronUp className="h-4 w-4 text-[#b9c6c8]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#b9c6c8]" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedEarningId === earning.id && (
                      <div className="p-6 bg-[#b9c6c8]/10 border-t border-[#b9c6c8]/20">
                        <div className="space-y-3">
                          <div className="flex">
                            <Package className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#1d2c36]">Delivery Address</p>
                              <p className="text-sm text-[#1d2c36]/70">{earning.order.delivery_address}</p>
                            </div>
                          </div>
                          <div className="flex">
                            <Banknote className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#1d2c36]">Earning Amount</p>
                              <p className="text-sm text-green-600 font-medium">₦{earning.amount.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex">
                            <Clock className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#1d2c36]">Payment Status</p>
                              <p
                                className={`text-sm font-medium ${
                                  earning.status === "paid" ? "text-green-600" : "text-yellow-600"
                                }`}
                              >
                                {earning.status === "paid" ? "Paid" : "Pending Payment"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Banknote className="h-12 w-12 text-[#b9c6c8] mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1 text-[#1d2c36]">No Earnings Yet</h3>
                <p className="text-[#1d2c36]/70 mb-4">You haven't earned anything yet. Start delivering to earn!</p>
                <Button
                  onClick={() => router.push("/rider/available-orders")}
                  className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none"
                >
                  Find Available Orders
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RiderLayout>
  )
}

export default EarningsPage

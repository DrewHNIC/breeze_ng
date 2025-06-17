"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { Package, Clock, Star, Calendar, MapPin, Loader2, AlertCircle, ArrowRight, CheckCircle, Bike, ToggleLeft, ToggleRight, DollarSign, User } from 'lucide-react'
import RiderLayout from "@/components/RiderLayout"

// Create a simple toast implementation since we don't have the hook
const toast = (props: { title: string; description: string; variant?: string }) => {
  alert(`${props.title}: ${props.description}`)
}

interface RiderStats {
  id: string
  name: string
  is_available: boolean
  is_active: boolean
  rating: number | null
  total_deliveries: number
  total_earnings: number
  created_at: string
}

interface RecentDelivery {
  id: string
  completed_at: string
  delivery_address: string
  vendor: {
    store_name: string
  }
  earnings: {
    amount: number
  }
}

interface CurrentOrder {
  id: string
  created_at: string
  status: string
  vendor: {
    store_name: string
  }
}

const RiderHomePage = () => {
  const router = useRouter()
  const [riderStats, setRiderStats] = useState<RiderStats | null>(null)
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [riderId, setRiderId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchRiderData()
    }
  }, [riderId])

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

  const fetchRiderData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch rider stats
      const { data: riderData, error: riderError } = await supabase
        .from("riders")
        .select("id, name, is_available, is_active, rating, total_deliveries, total_earnings, created_at")
        .eq("id", riderId)
        .single()

      if (riderError) {
        console.error("Error fetching rider stats:", riderError)
        setError("Failed to load rider data. Please try again.")
        return
      }

      setRiderStats(riderData)

      // Fetch recent deliveries
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("orders")
        .select(`
          id, 
          updated_at,
          delivery_address,
          vendor:vendors(store_name),
          earnings:rider_earnings(amount)
        `)
        .eq("rider_id", riderId)
        .eq("status", "delivered")
        .order("updated_at", { ascending: false })
        .limit(5)

      if (deliveriesError) {
        console.error("Error fetching recent deliveries:", deliveriesError)
      } else {
        // Process the data to fix nested structure from Supabase
        const processedDeliveries: RecentDelivery[] = deliveriesData.map((order) => ({
          id: order.id,
          completed_at: order.updated_at,
          delivery_address: order.delivery_address,
          vendor: {
            store_name: order.vendor[0]?.store_name || "Unknown Restaurant",
          },
          earnings: order.earnings[0] || { amount: 0 },
        }))

        setRecentDeliveries(processedDeliveries)
      }

      // Check for current active order
      const { data: currentOrderData, error: currentOrderError } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at,
          status,
          vendor:vendors(store_name)
        `)
        .eq("rider_id", riderId)
        .in("status", ["preparing", "picked_up", "on_the_way"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (currentOrderError) {
        if (currentOrderError.code !== "PGRST116") {
          // No results error
          console.error("Error fetching current order:", currentOrderError)
        }
      } else {
        // Process the data to fix nested structure from Supabase
        const processedOrder: CurrentOrder = {
          id: currentOrderData.id,
          created_at: currentOrderData.created_at,
          status: currentOrderData.status,
          vendor: {
            store_name: currentOrderData.vendor[0]?.store_name || "Unknown Restaurant",
          },
        }

        setCurrentOrder(processedOrder)
      }
    } catch (error) {
      console.error("Error in fetchRiderData:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAvailability = async () => {
    if (!riderStats) return

    try {
      setIsUpdatingStatus(true)

      const newStatus = !riderStats.is_available

      const { error } = await supabase
        .from("riders")
        .update({
          is_available: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", riderStats.id)

      if (error) {
        console.error("Error updating availability:", error)
        toast({
          title: "Failed to update status",
          description: "Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setRiderStats({
        ...riderStats,
        is_available: newStatus,
      })

      toast({
        title: "Status updated",
        description: `You are now ${newStatus ? "available" : "unavailable"} for deliveries.`,
      })
    } catch (error) {
      console.error("Error in toggleAvailability:", error)
      toast({
        title: "An error occurred",
        description: "Failed to update your status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
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

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Preparing at restaurant"
      case "picked_up":
        return "Picked up from restaurant"
      case "on_the_way":
        return "On the way to customer"
      default:
        return status.replace("_", " ")
    }
  }

  if (isLoading) {
    return (
      <RiderLayout title="Home">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Home">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchRiderData}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  if (!riderStats) return null

  return (
    <RiderLayout title="Home">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1d2c36]">Welcome, {riderStats.name.split(" ")[0]}</h1>
          <button
            onClick={toggleAvailability}
            disabled={isUpdatingStatus}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-md ${
              riderStats.is_available
                ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300"
                : "bg-gradient-to-r from-[#8f8578] to-[#7a7066] text-[#1d2c36] hover:from-[#7a7066] hover:to-[#6b5f54]"
            }`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : riderStats.is_available ? (
              <ToggleRight className="h-5 w-5 mr-2" />
            ) : (
              <ToggleLeft className="h-5 w-5 mr-2" />
            )}
            {riderStats.is_available ? "Available" : "Unavailable"}
          </button>
        </div>

        {/* Current Delivery Card */}
        {currentOrder ? (
          <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#b9c6c8]">
            <div className="flex items-start justify-between">
              <div className="flex">
                <Bike className="h-10 w-10 text-[#b9c6c8] mr-3 flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-lg text-[#1d2c36]">Current Delivery</h2>
                  <p className="text-[#1d2c36]/80">{currentOrder.vendor.store_name}</p>
                  <p className="text-sm text-[#1d2c36]/70">Status: {getStatusText(currentOrder.status)}</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/rider/current-delivery")}
                className="flex items-center text-[#b9c6c8] hover:text-[#a8b5b8] transition-colors duration-200"
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ) : riderStats.is_available ? (
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-lg p-6 mb-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-green-500 mr-3" />
              <div>
                <h2 className="font-bold text-lg text-[#1d2c36]">You're Available for Deliveries</h2>
                <p className="text-[#1d2c36]/70">Check available orders to start earning</p>
              </div>
              <button
                onClick={() => router.push("/rider/available-orders")}
                className="ml-auto flex items-center px-6 py-3 bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] rounded-lg hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-200 shadow-md font-medium"
              >
                Find Orders
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#8f8578]/20 to-[#7a7066]/20 rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#8f8578]">
            <div className="flex items-center">
              <AlertCircle className="h-10 w-10 text-[#8f8578] mr-3" />
              <div>
                <h2 className="font-bold text-lg text-[#1d2c36]">You're Currently Unavailable</h2>
                <p className="text-[#1d2c36]/70">Toggle your status to start receiving orders</p>
              </div>
              <button
                onClick={toggleAvailability}
                className="ml-auto flex items-center px-6 py-3 bg-gradient-to-r from-[#8f8578] to-[#7a7066] text-[#1d2c36] rounded-lg hover:from-[#7a7066] hover:to-[#6b5f54] transition-all duration-200 shadow-md font-medium"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ToggleLeft className="h-4 w-4 mr-2" />
                )}
                Go Online
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center">
              <Package className="h-8 w-8 text-[#b9c6c8] mb-2" />
              <p className="text-sm text-[#1d2c36]/70">Total Deliveries</p>
              <p className="text-xl font-bold text-[#1d2c36]">{riderStats.total_deliveries}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center">
              <Clock className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-[#1d2c36]/70">Total Earnings</p>
              <p className="text-xl font-bold text-[#1d2c36]">₦{riderStats.total_earnings.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center">
              <Star className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-sm text-[#1d2c36]/70">Rating</p>
              <p className="text-xl font-bold text-[#1d2c36]">
                {riderStats.rating ? riderStats.rating.toFixed(1) : "N/A"}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center">
              <Calendar className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-sm text-[#1d2c36]/70">Member Since</p>
              <p className="text-sm font-medium text-[#1d2c36]">
                {formatJoinDate(riderStats.created_at).split(",")[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-[#b9c6c8]/30">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#1d2c36]">Recent Deliveries</h2>
              {recentDeliveries.length > 0 && (
                <button
                  onClick={() => router.push("/rider/delivery-history")}
                  className="text-sm text-[#b9c6c8] hover:text-[#a8b5b8] flex items-center transition-colors duration-200"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>

          {recentDeliveries.length > 0 ? (
            <div className="divide-y divide-[#b9c6c8]/20">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-6 hover:bg-[#b9c6c8]/10 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <Clock className="h-5 w-5 text-[#b9c6c8] mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-[#1d2c36]">{delivery.vendor.store_name}</h3>
                        <p className="text-sm text-[#1d2c36]/70">{formatDate(delivery.completed_at)}</p>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 text-[#b9c6c8] mr-1" />
                          <p className="text-xs text-[#1d2c36]/60 truncate max-w-[200px]">
                            {delivery.delivery_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">₦{delivery.earnings.amount.toLocaleString()}</p>
                      <p className="text-xs text-[#1d2c36]/60">Your Earnings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-[#b9c6c8] mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1 text-[#1d2c36]">No Deliveries Yet</h3>
              <p className="text-[#1d2c36]/70 mb-4">You haven't completed any deliveries yet.</p>
              <button
                onClick={() => router.push("/rider/available-orders")}
                className="px-6 py-3 bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] rounded-lg hover:from-[#a8b5b8] hover:to-[#97a4a7] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8] focus:ring-offset-2 transition-all duration-200 shadow-md font-medium"
              >
                Find Available Orders
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/rider/available-orders")}
            className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 hover:from-[#7a7066] hover:to-[#6b5f54] flex flex-col items-center transition-all duration-200"
          >
            <Package className="h-8 w-8 text-[#b9c6c8] mb-2" />
            <p className="font-medium text-[#1d2c36]">Available Orders</p>
          </button>
          <button
            onClick={() => router.push("/rider/earnings")}
            className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 hover:from-[#7a7066] hover:to-[#6b5f54] flex flex-col items-center transition-all duration-200"
          >
            <DollarSign className="h-8 w-8 text-green-500 mb-2" />
            <p className="font-medium text-[#1d2c36]">Earnings</p>
          </button>
          <button
            onClick={() => router.push("/rider/delivery-history")}
            className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 hover:from-[#7a7066] hover:to-[#6b5f54] flex flex-col items-center transition-all duration-200"
          >
            <Clock className="h-8 w-8 text-[#b9c6c8] mb-2" />
            <p className="font-medium text-[#1d2c36]">Delivery History</p>
          </button>
          <button
            onClick={() => router.push("/rider/profile")}
            className="bg-gradient-to-br from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 hover:from-[#7a7066] hover:to-[#6b5f54] flex flex-col items-center transition-all duration-200"
          >
            <User className="h-8 w-8 text-[#b9c6c8] mb-2" />
            <p className="font-medium text-[#1d2c36]">Profile</p>
          </button>
        </div>
      </div>
    </RiderLayout>
  )
}

export default RiderHomePage

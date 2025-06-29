"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import {
  MapPin,
  Package,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import RiderLayout from "@/components/RiderLayout"

interface DeliveryHistoryItem {
  id: string
  created_at: string
  completed_at: string
  delivery_address: string
  vendor_id: string
  vendor: {
    store_name: string
  }
  rating?: {
    rating: number
    comment: string
  }
}

const DeliveryHistoryPage = () => {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [riderId, setRiderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; description: string; type: string }>
  >([])

  // Stats
  const [totalDeliveries, setTotalDeliveries] = useState(0)

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
      fetchDeliveryHistory()
      fetchRiderStatus()
    }
  }, [riderId, dateFilter, sortOrder])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDeliveries(deliveries)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = deliveries.filter(
        (delivery) =>
          delivery.vendor.store_name.toLowerCase().includes(query) ||
          delivery.delivery_address.toLowerCase().includes(query) ||
          delivery.id.toLowerCase().includes(query),
      )
      setFilteredDeliveries(filtered)
    }
  }, [searchQuery, deliveries])

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

  const fetchDeliveryHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching delivery history...")

      // Build the query based on date filter
      let query = supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          updated_at,
          delivery_address,
          vendor_id
        `)
        .eq("rider_id", riderId)
        .eq("status", "delivered")

      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        query = query.gte("updated_at", today)
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        query = query.gte("updated_at", weekAgo)
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
        query = query.gte("updated_at", monthAgo)
      }

      // Apply sort order
      query = query.order("updated_at", { ascending: sortOrder === "asc" })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching delivery history:", error)
        setError("Failed to load delivery history. Please try again.")
        return
      }

      console.log("Delivery history data:", data)

      // Process the data to fix nested structure from Supabase
      const processedData: DeliveryHistoryItem[] = await Promise.all(
        data.map(async (order) => {
          // Get vendor details
          const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select("store_name")
            .eq("id", order.vendor_id)
            .single()

          console.log("Vendor data for order", order.id, ":", vendorData)

          if (vendorError) {
            console.error("Error fetching vendor for order", order.id, ":", vendorError)
          }

          // Get rider rating for this order
          const { data: ratingData, error: ratingError } = await supabase
            .from("rider_ratings")
            .select("rating, comment")
            .eq("order_id", order.id)
            .single()

          if (ratingError && ratingError.code !== "PGRST116") {
            console.error("Error fetching rating for order", order.id, ":", ratingError)
          }

          return {
            id: order.id,
            created_at: order.created_at,
            completed_at: order.updated_at,
            delivery_address: order.delivery_address,
            vendor_id: order.vendor_id,
            vendor: {
              store_name: vendorData?.store_name || "Unknown Restaurant",
            },
            rating: ratingData
              ? {
                  rating: ratingData.rating,
                  comment: ratingData.comment || "",
                }
              : undefined,
          }
        }),
      )

      console.log("Processed delivery history:", processedData)

      setDeliveries(processedData)
      setFilteredDeliveries(processedData)

      // Calculate stats
      setTotalDeliveries(processedData.length)
    } catch (error) {
      console.error("Error in fetchDeliveryHistory:", error)
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

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  if (isLoading) {
    return (
      <RiderLayout title="Delivery History">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Delivery History">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading History</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchDeliveryHistory()}
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
    <RiderLayout title="Delivery History">
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

        <h1 className="text-2xl font-bold mb-6 text-[#1d2c36]">Delivery History</h1>

        {/* Stats Card */}
        <Card className="mb-6 bg-gradient-to-br from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-sm text-[#1d2c36]/70 mb-1">Total Deliveries</h3>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-[#b9c6c8] mr-2" />
              <span className="text-2xl font-bold text-[#1d2c36]">{totalDeliveries}</span>
            </div>
          </CardContent>
        </Card>

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

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b9c6c8] h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search deliveries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#b9c6c8]/20 text-[#1d2c36] border-[#b9c6c8]/30 placeholder:text-[#1d2c36]/50 focus:ring-[#b9c6c8]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredDeliveries.length > 0 ? (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
                <CardContent className="p-0">
                  <div
                    className="p-6 cursor-pointer hover:bg-[#b9c6c8]/10 transition-colors duration-200"
                    onClick={() => toggleOrderExpand(delivery.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-[#1d2c36]">{delivery.vendor.store_name}</h3>
                        <p className="text-sm text-[#1d2c36]/70">Order #{delivery.id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        {delivery.rating ? (
                          <div className="flex items-center">
                            <div className="flex mr-2">{renderStars(delivery.rating.rating)}</div>
                            <span className="text-sm text-[#1d2c36]/70">({delivery.rating.rating}/5)</span>
                          </div>
                        ) : (
                          <p className="text-sm text-[#1d2c36]/70">No rating</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-[#1d2c36]/70">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(delivery.completed_at)}
                      </div>
                      <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        {expandedOrderId === delivery.id ? (
                          <ChevronUp className="h-4 w-4 text-[#b9c6c8]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#b9c6c8]" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedOrderId === delivery.id && (
                    <div className="p-6 bg-[#b9c6c8]/10 border-t border-[#b9c6c8]/20">
                      <div className="space-y-3">
                        <div className="flex">
                          <MapPin className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#1d2c36]">Delivery Address</p>
                            <p className="text-sm text-[#1d2c36]/70">{delivery.delivery_address}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <Clock className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#1d2c36]">Order Time</p>
                            <p className="text-sm text-[#1d2c36]/70">{formatDate(delivery.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <Clock className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#1d2c36]">Delivery Time</p>
                            <p className="text-sm text-[#1d2c36]/70">{formatDate(delivery.completed_at)}</p>
                          </div>
                        </div>
                        {delivery.rating && (
                          <div className="flex">
                            <Star className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#1d2c36]">Customer Rating</p>
                              <div className="flex items-center mt-1">
                                <div className="flex mr-2">{renderStars(delivery.rating.rating)}</div>
                                <span className="text-sm text-[#1d2c36]/70">({delivery.rating.rating}/5)</span>
                              </div>
                              {delivery.rating.comment && (
                                <p className="text-sm text-[#1d2c36]/70 mt-1 italic">"{delivery.rating.comment}"</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-[#b9c6c8] mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1 text-[#1d2c36]">No Delivery History</h3>
              <p className="text-[#1d2c36]/70 mb-4">You haven't completed any deliveries yet.</p>
              <Button
                onClick={() => router.push("/rider/available-orders")}
                className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none"
              >
                Find Available Orders
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RiderLayout>
  )
}

export default DeliveryHistoryPage

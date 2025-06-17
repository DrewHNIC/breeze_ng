"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { MapPin, Package, Clock, AlertCircle, Loader2, RefreshCw, Search, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import RiderLayout from "@/components/RiderLayout"

interface AvailableOrder {
  id: string
  created_at: string
  delivery_address: string
  contact_number: string
  special_instructions: string | null
  vendor: {
    id: string
    store_name: string
    address: string
  }
  estimated_delivery_time: string | null
  items_count: number
  estimated_earnings: number
  delivery_fee: number
  service_fee: number
}

const AvailableOrdersPage = () => {
  const router = useRouter()
  const [orders, setOrders] = useState<AvailableOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<AvailableOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [riderId, setRiderId] = useState<string | null>(null)
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
      fetchAvailableOrders()

      // Set up polling for new orders
      const interval = setInterval(() => {
        if (!isRefreshing) {
          fetchAvailableOrders(false)
        }
      }, 30000) // Check for new orders every 30 seconds

      return () => clearInterval(interval)
    }
  }, [riderId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter(
        (order) =>
          order.vendor.store_name.toLowerCase().includes(query) ||
          order.delivery_address.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query),
      )
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

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
      const { data, error } = await supabase
        .from("riders")
        .select("id, is_available")
        .eq("id", session.user.id)
        .single()

      if (error || !data) {
        router.push("/login")
        return
      }

      setRiderId(data.id)
      setRiderStatus(data.is_available)

      // If rider is not available, update status
      if (!data.is_available) {
        await supabase.from("riders").update({ is_available: true }).eq("id", data.id)

        setRiderStatus(true)
        setStatusUpdateTime(new Date().toLocaleTimeString())

        addNotification({
          title: "Status updated",
          description: "You are now available for deliveries.",
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
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

  const fetchAvailableOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setIsRefreshing(true)
      setError(null)

      console.log("Fetching available orders...")

      // Get orders that are ready but don't have a rider assigned
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          total_amount,
          delivery_address,
          contact_number,
          special_instructions,
          estimated_delivery_time,
          vendor_id,
          delivery_fee,
          service_fee,
          items_count:order_items(count)
        `)
        .eq("status", "ready")
        .is("rider_id", null)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching available orders:", error)
        setError("Failed to load available orders. Please try again.")
        return
      }

      console.log("Orders data:", data)

      // Fetch vendor details separately for each order
      const processedData: AvailableOrder[] = await Promise.all(
        data.map(async (order) => {
          // Get vendor details
          const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select(`
              id, 
              store_name
            `)
            .eq("id", order.vendor_id)
            .single()

          console.log("Vendor data for order", order.id, ":", vendorData)

          if (vendorError) {
            console.error("Error fetching vendor for order", order.id, ":", vendorError)
          }

          // Get vendor profile for address
          const { data: profileData, error: profileError } = await supabase
            .from("vendor_profiles")
            .select("address")
            .eq("vendor_id", order.vendor_id)
            .single()

          console.log("Profile data for vendor", order.vendor_id, ":", profileData)

          if (profileError) {
            console.error("Error fetching vendor profile for vendor", order.vendor_id, ":", profileError)
          }

          // Calculate rider earnings: delivery fee + 10% of service fee
          const deliveryFee = order.delivery_fee || 500 // Default delivery fee
          const serviceFee = order.service_fee || 0
          const riderEarnings = deliveryFee + serviceFee * 0.1

          return {
            id: order.id,
            created_at: order.created_at,
            delivery_address: order.delivery_address,
            contact_number: order.contact_number,
            special_instructions: order.special_instructions,
            estimated_delivery_time: order.estimated_delivery_time,
            vendor: {
              id: vendorData?.id || "",
              store_name: vendorData?.store_name || "Restaurant",
              address: profileData?.address || "Address not available",
            },
            items_count: order.items_count.length,
            estimated_earnings: riderEarnings,
            delivery_fee: deliveryFee,
            service_fee: serviceFee,
          }
        }),
      )

      console.log("Processed data:", processedData)

      setOrders(processedData)
      setFilteredOrders(processedData)
    } catch (error) {
      console.error("Error in fetchAvailableOrders:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshOrders = () => {
    setIsRefreshing(true)
    fetchAvailableOrders()
  }

  const acceptOrder = async (orderId: string) => {
    try {
      if (!riderId) return

      const { error } = await supabase
        .from("orders")
        .update({
          rider_id: riderId,
          status: "picked_up",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("status", "ready")
        .is("rider_id", null)

      if (error) {
        console.error("Error accepting order:", error)
        addNotification({
          title: "Failed to accept order",
          description: "This order may have been taken by another rider.",
          type: "error",
        })
        return
      }

      addNotification({
        title: "Order accepted",
        description: "You have successfully accepted this delivery.",
        type: "success",
      })

      // Redirect to current delivery page
      router.push(`/rider/current-delivery`)
    } catch (error) {
      console.error("Error in acceptOrder:", error)
      addNotification({
        title: "An error occurred",
        description: "Failed to accept the order.",
        type: "error",
      })
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

  if (isLoading) {
    return (
      <RiderLayout title="Available Orders">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Available Orders">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Orders</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchAvailableOrders()}
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
    <RiderLayout title="Available Orders">
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1d2c36]">Available Orders</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            disabled={isRefreshing}
            className="border-[#b9c6c8] text-[#1d2c36] hover:bg-[#b9c6c8]/10"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b9c6c8] h-4 w-4" />
          <Input
            placeholder="Search by restaurant or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#b9c6c8]/30 focus:ring-[#b9c6c8] focus:border-[#b9c6c8]"
          />
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="overflow-hidden bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-[#1d2c36]">{order.vendor.store_name}</h3>
                        <p className="text-sm text-[#1d2c36]/70">Order #{order.id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">₦{order.estimated_earnings.toLocaleString()}</p>
                        <p className="text-sm text-[#1d2c36]/70">Estimated Earnings</p>
                        <p className="text-xs text-[#1d2c36]/60">
                          Delivery: ₦{order.delivery_fee} + Service: ₦{Math.round(order.service_fee * 0.1)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex">
                        <Clock className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#1d2c36]/70">Ordered {formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex">
                        <Package className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#1d2c36]/70">
                          {order.items_count} {order.items_count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="flex">
                        <MapPin className="h-4 w-4 text-[#b9c6c8] mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-[#1d2c36] font-medium">Pickup:</p>
                          <p className="text-sm text-[#1d2c36]/70">{order.vendor.address || "Address not available"}</p>
                        </div>
                      </div>
                      <div className="flex">
                        <MapPin className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-[#1d2c36] font-medium">Delivery:</p>
                          <p className="text-sm text-[#1d2c36]/70">{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {order.special_instructions && (
                      <div className="bg-yellow-50/80 p-3 rounded-md mb-3">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Note: </span>
                          {order.special_instructions}
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none font-medium"
                      onClick={() => acceptOrder(order.id)}
                    >
                      Accept Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-8 text-center">
            <Package className="h-12 w-12 text-[#b9c6c8] mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1 text-[#1d2c36]">No Available Orders</h3>
            <p className="text-[#1d2c36]/70 mb-4">There are no orders available for delivery at the moment.</p>
            <Button
              variant="outline"
              onClick={refreshOrders}
              disabled={isRefreshing}
              className="border-[#b9c6c8] text-[#1d2c36] hover:bg-[#b9c6c8]/20"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </RiderLayout>
  )
}

export default AvailableOrdersPage

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import {
  MapPin,
  Package,
  Clock,
  Phone,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import RiderLayout from "@/components/RiderLayout"

// Define valid order statuses
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

interface OrderItem {
  id: string
  menu_item: {
    name: string
  }
  quantity: number
  unit_price: number
}

interface CurrentOrder {
  id: string
  created_at: string
  total_amount: number
  delivery_address: string
  contact_number: string
  special_instructions: string | null
  status: OrderStatus
  vendor_id: string
  vendor: {
    id: string
    store_name: string
    address: string
    contact_phone: string
  }
  customer: {
    id: string
    name: string
    phone_number: string
  }
  items: OrderItem[]
  estimated_earnings: number
  delivery_fee: number
  service_fee: number
}

const CurrentDeliveryPage = () => {
  const router = useRouter()
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [riderId, setRiderId] = useState<string | null>(null)
  const [copiedVendor, setCopiedVendor] = useState(false)
  const [copiedCustomer, setCopiedCustomer] = useState(false)
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)
  const [lastStatusUpdate, setLastStatusUpdate] = useState<string | null>(null)
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
      fetchCurrentDelivery()
      fetchRiderStatus()

      // Set up real-time subscription for order updates
      const subscription = supabase
        .channel("order-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `rider_id=eq.${riderId}`,
          },
          (payload) => {
            console.log("Real-time order update received:", payload)
            // Refresh the current delivery when status changes
            fetchCurrentDelivery()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [riderId])

  // Reset copy states after 2 seconds
  useEffect(() => {
    if (copiedVendor) {
      const timer = setTimeout(() => setCopiedVendor(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedVendor])

  useEffect(() => {
    if (copiedCustomer) {
      const timer = setTimeout(() => setCopiedCustomer(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedCustomer])

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

  const fetchCurrentDelivery = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching current delivery...")

      // Get the current active order for this rider
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          total_amount, 
          delivery_address,
          contact_number,
          special_instructions,
          status,
          vendor_id,
          customer_id,
          delivery_fee,
          service_fee,
          items:order_items(
            id, 
            quantity, 
            unit_price,
            menu_item_id
          )
        `)
        .eq("rider_id", riderId)
        .in("status", ["picked_up", "out_for_delivery"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No current delivery
          setCurrentOrder(null)
        } else {
          console.error("Error fetching current delivery:", error)
          setError("Failed to load current delivery. Please try again.")
        }
        return
      }

      console.log("Current order data:", data)

      // Fetch vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select(`
          id, 
          store_name
        `)
        .eq("id", data.vendor_id)
        .single()

      console.log("Vendor data:", vendorData)

      if (vendorError) {
        console.error("Error fetching vendor:", vendorError)
      }

      // Fetch vendor profile for address and contact phone
      const { data: profileData, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("address, contact_phone")
        .eq("vendor_id", data.vendor_id)
        .single()

      console.log("Vendor profile data:", profileData)

      if (profileError) {
        console.error("Error fetching vendor profile:", profileError)
      }

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, phone_number")
        .eq("id", data.customer_id)
        .single()

      console.log("Customer data:", customerData)

      if (customerError) {
        console.error("Error fetching customer:", customerError)
      }

      // Fetch menu items for each order item
      const menuItemPromises = data.items.map(async (item) => {
        const { data: menuItemData, error: menuItemError } = await supabase
          .from("menu_items")
          .select("name")
          .eq("id", item.menu_item_id)
          .single()

        if (menuItemError) {
          console.error("Error fetching menu item:", menuItemError)
          return {
            ...item,
            menu_item: { name: "Unknown Item" },
          }
        }

        return {
          ...item,
          menu_item: { name: menuItemData.name },
        }
      })

      const processedItems = await Promise.all(menuItemPromises)

      // Calculate rider earnings: delivery fee + 10% of service fee
      const deliveryFee = data.delivery_fee || 500 // Default delivery fee
      const serviceFee = data.service_fee || 0
      const riderEarnings = deliveryFee + serviceFee * 0.1

      // Construct the processed order
      const processedOrder: CurrentOrder = {
        ...data,
        vendor: {
          id: vendorData?.id || "",
          store_name: vendorData?.store_name || "Restaurant",
          address: profileData?.address || "Address not available",
          contact_phone: profileData?.contact_phone || "",
        },
        customer: {
          id: customerData?.id || "",
          name: customerData?.name || "Customer",
          phone_number: customerData?.phone_number || data.contact_number || "",
        },
        items: processedItems,
        estimated_earnings: riderEarnings,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
      }

      console.log("Processed order:", processedOrder)

      setCurrentOrder(processedOrder)
    } catch (error) {
      console.error("Error in fetchCurrentDelivery:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!currentOrder || !riderId) return

    try {
      setIsUpdating(true)

      // Log the update request for debugging
      console.log("Updating order status:", {
        order_id: currentOrder.id,
        rider_id: riderId,
        new_status: newStatus,
        current_status: currentOrder.status,
      })

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentOrder.id)

      if (error) {
        console.error("Error updating order status:", error)
        addNotification({
          title: "Failed to update status",
          description: "Please try again. " + error.message,
          type: "error",
        })
        return
      }

      // Record the time of status update
      const updateTime = new Date().toLocaleTimeString()
      setLastStatusUpdate(`Order status updated to ${newStatus.replace("_", " ")} at ${updateTime}`)

      // If order is completed, update rider stats and earnings
      if (newStatus === "delivered") {
        // Calculate rider earnings: delivery fee + 10% of service fee
        const riderEarnings = currentOrder.delivery_fee + currentOrder.service_fee * 0.1

        // Update rider stats
        await supabase.rpc("update_rider_stats", {
          rider_id: riderId,
          delivery_fee: riderEarnings,
        })

        // Add to rider earnings
        await supabase.from("rider_earnings").insert({
          rider_id: riderId,
          order_id: currentOrder.id,
          amount: riderEarnings,
          status: "pending",
        })

        addNotification({
          title: "Delivery completed!",
          description: `You earned ₦${riderEarnings.toLocaleString()} from this delivery.`,
          type: "success",
        })

        // Redirect to available orders
        router.push("/rider/available-orders")
      } else {
        // Refresh the current delivery
        fetchCurrentDelivery()

        addNotification({
          title: "Status updated",
          description: `Order is now ${newStatus.replace("_", " ")}.`,
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error in updateOrderStatus:", error)
      addNotification({
        title: "An error occurred",
        description: "Failed to update the order status.",
        type: "error",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = (text: string, type: "vendor" | "customer") => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (type === "vendor") {
          setCopiedVendor(true)
        } else {
          setCopiedCustomer(true)
        }
        addNotification({
          title: "Copied to clipboard",
          description: "Phone number copied to clipboard",
          type: "success",
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        addNotification({
          title: "Failed to copy",
          description: "Please try again",
          type: "error",
        })
      })
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

  const getNextAction = () => {
    if (!currentOrder) return null

    switch (currentOrder.status) {
      case "picked_up":
        return {
          label: "Mark as Out for Delivery",
          action: () => updateOrderStatus("out_for_delivery"),
          icon: Truck,
        }
      case "out_for_delivery":
        return {
          label: "Mark as Delivered",
          action: () => updateOrderStatus("delivered"),
          icon: CheckCircle,
        }
      default:
        return null
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { label: "Picked Up", value: "picked_up", status: "" },
      { label: "Out for Delivery", value: "out_for_delivery", status: "" },
      { label: "Delivered", value: "delivered", status: "" },
    ]

    if (!currentOrder) return steps

    const currentIndex = steps.findIndex((step) => step.value === currentOrder.status)
    return steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming",
    }))
  }

  if (isLoading) {
    return (
      <RiderLayout title="Current Delivery">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Current Delivery">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Delivery</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchCurrentDelivery()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Try Again
            </Button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  if (!currentOrder) {
    return (
      <RiderLayout title="Current Delivery">
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

        <div className="container mx-auto px-4 py-8">
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
                {statusUpdateTime && (
                  <p className="text-xs text-gray-500 mt-0.5">Status updated at {statusUpdateTime}</p>
                )}
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

          <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-8 text-center">
            <Package className="h-12 w-12 text-[#b9c6c8] mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1 text-[#1d2c36]">No Active Delivery</h3>
            <p className="text-[#1d2c36]/70 mb-4">You don't have any active deliveries at the moment.</p>
            <Button
              onClick={() => router.push("/rider/available-orders")}
              className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none"
            >
              Find Available Orders
            </Button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  const nextAction = getNextAction()
  const statusSteps = getStatusSteps()

  return (
    <RiderLayout title="Current Delivery">
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

        {/* Status Update Notification */}
        {lastStatusUpdate && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg flex items-center shadow-md">
            <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
            <p className="text-blue-700 text-sm">{lastStatusUpdate}</p>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-[#1d2c36]">Current Delivery</h1>

        {/* Status Stepper */}
        <Card className="mb-6 bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.value} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 ${
                      step.status === "completed"
                        ? "bg-green-500 text-white"
                        : step.status === "current"
                          ? "bg-[#b9c6c8] text-[#1d2c36]"
                          : "bg-[#1d2c36]/20 text-[#1d2c36]/50"
                    }`}
                  >
                    {step.status === "completed" ? <CheckCircle className="h-5 w-5" /> : <span>{index + 1}</span>}
                  </div>
                  <span
                    className={`text-xs text-center ${
                      step.status === "completed"
                        ? "text-green-600"
                        : step.status === "current"
                          ? "text-[#1d2c36] font-medium"
                          : "text-[#1d2c36]/50"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-2">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#1d2c36]/20 -translate-y-1/2"></div>
              <div
                className="absolute top-1/2 left-4 h-1 bg-green-500 -translate-y-1/2"
                style={{
                  width: `${
                    currentOrder.status === "picked_up"
                      ? "0%"
                      : currentOrder.status === "out_for_delivery"
                        ? "50%"
                        : "100%"
                  }`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6 bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardHeader className="bg-[#b9c6c8]/20 border-b border-[#b9c6c8]/30 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-[#1d2c36]">{currentOrder.vendor.store_name}</h2>
                <p className="text-sm text-[#1d2c36]/70">Order #{currentOrder.id.substring(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">₦{currentOrder.estimated_earnings.toLocaleString()}</p>
                <p className="text-sm text-[#1d2c36]/70">Your Earnings</p>
                <p className="text-xs text-[#1d2c36]/60">
                  Delivery: ₦{currentOrder.delivery_fee} + Service: ₦{Math.round(currentOrder.service_fee * 0.1)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex">
                <Clock className="h-5 w-5 text-[#b9c6c8] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1d2c36]">Order Time</p>
                  <p className="text-sm text-[#1d2c36]/70">{formatDate(currentOrder.created_at)}</p>
                </div>
              </div>

              <div className="flex">
                <MapPin className="h-5 w-5 text-[#b9c6c8] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1d2c36]">Pickup Location</p>
                  <p className="text-sm text-[#1d2c36]/70">{currentOrder.vendor.address}</p>

                  {currentOrder.vendor.contact_phone && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-[#1d2c36]">Restaurant Phone:</p>
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 text-[#b9c6c8] mr-1" />
                        <span className="text-sm text-[#1d2c36]/70">{currentOrder.vendor.contact_phone}</span>
                        <Button
                          onClick={() => copyToClipboard(currentOrder.vendor.contact_phone, "vendor")}
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-1 text-[#b9c6c8] hover:text-[#a8b5b8] rounded-full hover:bg-[#b9c6c8]/10 h-auto"
                        >
                          {copiedVendor ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex">
                <MapPin className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1d2c36]">Delivery Location</p>
                  <p className="text-sm text-[#1d2c36]/70">{currentOrder.delivery_address}</p>

                  {(currentOrder.customer.phone_number || currentOrder.contact_number) && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-[#1d2c36]">Customer Phone:</p>
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 text-[#b9c6c8] mr-1" />
                        <span className="text-sm text-[#1d2c36]/70">
                          {currentOrder.customer.phone_number || currentOrder.contact_number}
                        </span>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              currentOrder.customer.phone_number || currentOrder.contact_number,
                              "customer",
                            )
                          }
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-1 text-[#b9c6c8] hover:text-[#a8b5b8] rounded-full hover:bg-[#b9c6c8]/10 h-auto"
                        >
                          {copiedCustomer ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(currentOrder.delivery_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#b9c6c8] hover:text-[#a8b5b8]"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </a>
                  </div>
                </div>
              </div>

              {currentOrder.special_instructions && (
                <div className="bg-yellow-50/80 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Special Instructions: </span>
                    {currentOrder.special_instructions}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6 bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
          <CardHeader className="p-6 border-b border-[#b9c6c8]/30">
            <h3 className="font-medium text-[#1d2c36]">Order Items ({currentOrder.items.length})</h3>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[#b9c6c8]/20">
              {currentOrder.items.map((item) => (
                <li key={item.id} className="p-6 flex justify-between">
                  <div>
                    <p className="font-medium text-[#1d2c36]">{item.menu_item.name}</p>
                    <p className="text-sm text-[#1d2c36]/70">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-[#b9c6c8] mr-1" />
                    <span className="text-sm text-[#1d2c36]/70">Item</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        {nextAction && (
          <Button
            onClick={() => nextAction.action()}
            disabled={isUpdating}
            className="w-full bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none font-medium"
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <nextAction.icon className="h-5 w-5 mr-2" />
            )}
            {isUpdating ? "Updating..." : nextAction.label}
          </Button>
        )}
      </div>
    </RiderLayout>
  )
}

export default CurrentDeliveryPage

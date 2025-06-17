"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import OrderStatusTimeline from "@/components/customer/OrderStatusTimeline"
import OrderDetails from "@/components/customer/OrderDetails"
import { ArrowLeft, Loader2, AlertCircle, Phone, Clock, MapPin, Copy, Check, Store, Truck } from "lucide-react"

interface Order {
  id: string
  order_code?: string
  status: string
  total_amount: number
  original_amount?: number
  discount_amount?: number
  delivery_fee?: number
  distance_km?: number
  loyalty_points_redeemed?: number
  created_at: string
  updated_at: string
  delivery_address: string
  delivery_city?: string
  delivery_state?: string
  customer_id: string
  vendor_id: string
  rider_id: string | null
  estimated_delivery_time: string | null
  payment_method: string
  payment_status: string
  actual_delivery_time: string | null
  contact_number: string
  special_instructions: string | null
  vendor: {
    store_name: string
    contact_phone: string
  }
  items: OrderItem[]
}

interface OrderItem {
  id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

// Function to generate 3-digit order code from order ID
const generateOrderCode = (orderId: string): string => {
  // Use the first 8 characters of the UUID and convert to a 3-digit number
  const hashCode = orderId.substring(0, 8)
  let hash = 0
  for (let i = 0; i < hashCode.length; i++) {
    const char = hashCode.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Ensure it's a positive 3-digit number (100-999)
  const code = (Math.abs(hash) % 900) + 100
  return code.toString().padStart(3, "0")
}

const OrderTrackingPage = () => {
  const router = useRouter()
  const { id: orderId } = router.query

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorPhone, setVendorPhone] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    if (router.isReady && orderId) {
      checkAuth()
    }
  }, [router.isReady, orderId])

  useEffect(() => {
    if (customerId && orderId) {
      fetchOrderDetails()

      // Set up real-time subscription for order updates
      const subscription = supabase
        .channel("order-tracking")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            console.log("Real-time order update received:", payload)
            // Update the order state with new data
            if (payload.new) {
              setOrder((prevOrder) => {
                if (prevOrder) {
                  return {
                    ...prevOrder,
                    status: payload.new.status,
                    updated_at: payload.new.updated_at,
                    rider_id: payload.new.rider_id,
                  }
                }
                return prevOrder
              })
            }
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [customerId, orderId])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Check if user is a customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", session.user.id)
        .single()

      if (customerError || !customerData) {
        console.error("Error fetching customer data:", customerError)
        router.push("/login")
        return
      }

      setCustomerId(customerData.id)
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
    }
  }

  const fetchOrderDetails = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching order details for order ID:", orderId)

      // Fetch order with all the detailed information
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id, 
          order_code,
          status, 
          total_amount,
          original_amount,
          discount_amount,
          delivery_fee,
          distance_km,
          loyalty_points_redeemed,
          created_at,
          updated_at,
          delivery_address,
          delivery_city,
          delivery_state,
          customer_id,
          vendor_id,
          rider_id,
          estimated_delivery_time,
          payment_method,
          payment_status,
          actual_delivery_time,
          contact_number,
          special_instructions,
          vendor:vendors(
            store_name
          )
        `)
        .eq("id", orderId)
        .eq("customer_id", customerId)
        .single()

      if (orderError) {
        console.error("Error fetching order:", orderError)
        setError("Could not find the order. Please try again.")
        setIsLoading(false)
        return
      }

      console.log("Order data fetched:", orderData)

      // Generate order code if it doesn't exist
      let orderCode = orderData.order_code
      if (!orderCode) {
        orderCode = generateOrderCode(orderData.id)
        // Update the database with the generated order code
        await supabase.from("orders").update({ order_code: orderCode }).eq("id", orderData.id)
      }

      // Fetch vendor contact phone from vendor_profiles
      let vendorContactPhone = ""
      if (orderData.vendor_id) {
        const { data: vendorProfileData, error: vendorProfileError } = await supabase
          .from("vendor_profiles")
          .select("contact_phone")
          .eq("vendor_id", orderData.vendor_id)
          .single()

        if (!vendorProfileError && vendorProfileData) {
          vendorContactPhone = vendorProfileData.contact_phone || ""
          setVendorPhone(vendorContactPhone)
        }
      }

      // Fetch order items with menu item details
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          menu_item_id,
          quantity,
          unit_price,
          menu_items(name)
        `)
        .eq("order_id", orderId)

      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        setError("Could not load order items. Please try again.")
        setIsLoading(false)
        return
      }

      console.log("Order items fetched:", itemsData)

      // Transform the items data
      const transformedItems = itemsData.map((item: any) => {
        let itemName = "Unknown Item"

        // Handle menu_items data safely
        if (item.menu_items) {
          if (Array.isArray(item.menu_items) && item.menu_items.length > 0) {
            // If it's an array, take the first item's name
            itemName = item.menu_items[0]?.name || itemName
          } else if (typeof item.menu_items === "object" && item.menu_items !== null) {
            // If it's an object, try to get the name property
            itemName = item.menu_items.name || itemName
          }
        }

        return {
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: itemName,
          price: item.unit_price,
          quantity: item.quantity,
        }
      })

      // Extract vendor data safely
      let vendorName = "Unknown Restaurant"

      if (orderData.vendor) {
        if (Array.isArray(orderData.vendor) && orderData.vendor.length > 0) {
          vendorName = orderData.vendor[0].store_name || vendorName
        } else if (typeof orderData.vendor === "object") {
          // Check if it's a non-array object with the expected properties
          const vendor = orderData.vendor as { store_name?: string }
          vendorName = vendor.store_name || vendorName
        }
      }

      // Combine order and items
      const completeOrder: Order = {
        ...orderData,
        order_code: orderCode,
        vendor: {
          store_name: vendorName,
          contact_phone: vendorContactPhone,
        },
        items: transformedItems,
      }

      console.log("Complete order assembled:", completeOrder)
      setOrder(completeOrder)
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const getEstimatedDeliveryTime = () => {
    if (!order) return null

    if (order.estimated_delivery_time) {
      return new Date(order.estimated_delivery_time)
    }

    // If no estimated time is set, calculate based on order creation time
    // Assuming average delivery time is 45 minutes
    const createdAt = new Date(order.created_at)
    return new Date(createdAt.getTime() + 45 * 60000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatDeliveryAddress = () => {
    if (!order) return ""

    const parts = [order.delivery_address]
    if (order.delivery_city) parts.push(order.delivery_city)
    if (order.delivery_state) parts.push(order.delivery_state)

    return parts.join(", ")
  }

  const estimatedDeliveryTime = getEstimatedDeliveryTime()

  return (
    <CustomerLayout title="Track Order">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/customer/orders" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-[#1d2c36] hover:text-[#b9c6c8] transition-colors" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1d2c36]">Track Order</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Order</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchOrderDetails()}
              className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] px-6 py-2 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : !order ? (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-yellow-700 mb-2">Order Not Found</h2>
            <p className="text-yellow-600 mb-4">We couldn't find the order you're looking for.</p>
            <Link
              href="/customer/orders"
              className="bg-gradient-to-r from-[#1d2c36] to-[#2a3f4d] text-[#8f8578] px-6 py-2 rounded-lg font-medium hover:from-[#2a3f4d] hover:to-[#3a4f5d] transition-all duration-300 inline-block"
            >
              View All Orders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order ID and Restaurant */}
              <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1d2c36]">
                      Order #{order.order_code || generateOrderCode(order.id)}
                    </h2>
                    <p className="text-[#1d2c36] opacity-75">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg text-[#1d2c36]">{order.vendor.store_name}</h3>
                    <p className="text-[#1d2c36] opacity-75">
                      {order.status === "delivered" ? "Delivered" : "Estimated delivery by"}:
                    </p>
                    <p className="font-medium text-[#1d2c36]">
                      {estimatedDeliveryTime
                        ? estimatedDeliveryTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Calculating..."}
                    </p>
                  </div>
                </div>

                {/* Order Status Timeline */}
                <OrderStatusTimeline status={order.status} createdAt={order.created_at} />
              </div>

              {/* Delivery Information */}
              <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
                <h2 className="text-xl font-bold mb-4 text-[#1d2c36]">Delivery Information</h2>

                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-[#1d2c36] mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1d2c36]">Delivery Address</p>
                    <p className="text-[#1d2c36] opacity-75">{formatDeliveryAddress()}</p>
                    {order.special_instructions && (
                      <p className="mt-1 text-sm text-[#1d2c36] opacity-75">
                        <span className="font-medium">Instructions:</span> {order.special_instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start mb-4">
                  <Clock className="h-5 w-5 text-[#1d2c36] mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1d2c36]">Estimated Delivery Time</p>
                    <p className="text-[#1d2c36] opacity-75">
                      {estimatedDeliveryTime
                        ? estimatedDeliveryTime.toLocaleString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "Calculating..."}
                    </p>
                  </div>
                </div>

                {/* Distance Information */}
                {order.distance_km && (
                  <div className="flex items-start">
                    <Truck className="h-5 w-5 text-[#1d2c36] mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#1d2c36]">Delivery Distance</p>
                      <p className="text-[#1d2c36] opacity-75">{order.distance_km.toFixed(1)} km from restaurant</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Status Message */}
              <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
                <h2 className="text-xl font-bold mb-4 text-[#1d2c36]">Delivery Status</h2>

                <div className="bg-[#1d2c36] border border-[#b9c6c8] rounded-lg p-4">
                  <p className="text-[#8f8578]">
                    {order.status === "pending" && "Your order has been placed and is awaiting confirmation."}
                    {order.status === "confirmed" && "Your order has been confirmed and is being prepared."}
                    {order.status === "preparing" && "Your order is being prepared by the restaurant."}
                    {order.status === "ready" && "Your order is ready and waiting for pickup by a delivery partner."}
                    {order.status === "picked_up" && "Your order has been picked up and is on the way to you."}
                    {order.status === "out_for_delivery" && "Your order is out for delivery and will arrive soon."}
                    {order.status === "delivered" && "Your order has been delivered. Enjoy your meal!"}
                    {order.status === "cancelled" && "This order has been cancelled."}
                  </p>
                  {(order.status === "pending" ||
                    order.status === "confirmed" ||
                    order.status === "preparing" ||
                    order.status === "ready") && (
                    <p className="mt-2 text-sm text-[#b9c6c8]">
                      A delivery partner will be assigned to your order soon.
                    </p>
                  )}
                  {(order.status === "picked_up" || order.status === "out_for_delivery") && (
                    <p className="mt-2 text-sm text-[#b9c6c8]">
                      Your delivery partner is on the way. You can track their progress in real-time.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Order Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderDetails order={order} />

                {/* Contact Restaurant */}
                <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6 mt-6">
                  <h2 className="font-bold mb-4 flex items-center text-[#1d2c36]">
                    <Store className="h-5 w-5 mr-2 text-[#1d2c36]" />
                    Restaurant Contact
                  </h2>

                  <div className="mb-4">
                    <p className="text-sm text-[#1d2c36] opacity-75 mb-1">Restaurant Name</p>
                    <p className="font-medium text-[#1d2c36]">{order.vendor.store_name}</p>
                  </div>

                  {order.vendor.contact_phone && (
                    <div>
                      <p className="text-sm text-[#1d2c36] opacity-75 mb-1">Phone Number</p>
                      <div className="flex items-center justify-between bg-[#1d2c36] p-3 rounded-lg">
                        <span className="font-medium text-[#8f8578]">{order.vendor.contact_phone}</span>
                        <button
                          onClick={() => copyToClipboard(order.vendor.contact_phone)}
                          className="text-[#b9c6c8] hover:text-[#8f8578] transition-colors"
                          aria-label="Copy phone number"
                        >
                          {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-[#1d2c36] opacity-60 mt-2">
                        Click the copy icon to copy the phone number, then dial it on your phone.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#1d2c36]">
                    <p className="text-sm text-[#1d2c36] opacity-75 mb-2">
                      If you have any questions about your order, please contact the restaurant directly.
                    </p>
                    {order.vendor.contact_phone && (
                      <a
                        href={`tel:${order.vendor.contact_phone}`}
                        className="bg-gradient-to-r from-[#1d2c36] to-[#2a3f4d] text-[#8f8578] w-full py-2 rounded-lg font-medium hover:from-[#2a3f4d] hover:to-[#3a4f5d] transition-all duration-300 flex items-center justify-center"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Restaurant
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default OrderTrackingPage